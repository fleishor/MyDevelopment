"""A terminal chat client using Textual and the OpenAI Responses API.

Windows PowerShell setup:
    py -m pip install -r requirements.txt
    $env:OPENAI_API_KEY = "your-api-key"
    py mcp_file_server.py  # In a separate terminal
    py tui_chat_client_mcp.py

Optional settings:
    $env:OPENAI_MODEL = "gpt-4.1-mini"
    $env:OPENAI_SYSTEM_PROMPT = "Answer in German."

The conversation is kept in memory only while this program runs. The last ten
user/assistant turns are sent on each request. Responses are requested with
store=False and the client does not write the chat to disk.
"""

import os
import json
import sys
import traceback
from typing import Any

from dotenv import load_dotenv
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from openai import APIConnectionError, APIStatusError, AsyncOpenAI, OpenAIError
from rich.markdown import Markdown
from rich.text import Text
from textual.app import App, ComposeResult
from textual.widgets import Footer, Input, RichLog, Static


load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")
SYSTEM_PROMPT = os.getenv(
    "OPENAI_SYSTEM_PROMPT",
    "You are a helpful assistant. Answer in the language used by the user.",
)
MAX_HISTORY_MESSAGES = 20  # Ten user/assistant pairs.
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://127.0.0.1:8080/mcp")


class ChatApp(App[None]):
    TITLE = "OpenAI Chat"
    CSS = """
    Screen {
        layout: vertical;
    }

    #chat {
        height: 1fr;
        border: round $accent;
        padding: 0 1;
    }

    #status {
        height: 1;
        padding: 0 1;
        color: $text-muted;
    }

    #prompt {
        height: 3;
    }
    """
    BINDINGS = [
        ("ctrl+q", "quit", "Beenden"),
        ("ctrl+l", "clear_chat", "Chat leeren"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self.client = AsyncOpenAI(api_key=API_KEY)
        self.history: list[dict[str, str]] = []
        self.mcp_tools = []
        self.tools = []
        self.tools_by_name = {}
        self.busy = False

    def compose(self) -> ComposeResult:
        yield RichLog(id="chat", wrap=True, markup=False, highlight=False)
        yield Static("", id="status")
        yield Input(placeholder="Nachricht eingeben und Enter drücken …", id="prompt")
        yield Footer()

    async def on_mount(self) -> None:
        chat = self.query_one("#chat", RichLog)
        chat.write(
            Text("Chat gestartet. Ctrl+L leert den Verlauf, Ctrl+Q beendet.", style="dim")
        )
        self.query_one("#prompt", Input).focus()
        try:
            async with streamable_http_client(MCP_SERVER_URL) as (
                read_stream,
                write_stream,
                _,
            ):
                async with ClientSession(read_stream, write_stream) as mcp_session:
                    await mcp_session.initialize()
                    self.mcp_tools = (await mcp_session.list_tools()).tools
        except Exception as exc:
            details = "".join(traceback.format_exception(exc)).rstrip()
            chat.write(Text(f"MCP-Tools konnten nicht geladen werden:\n{details}", style="bold red"))
        else:
            self.tools = [
                {
                    "type": "function",
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.inputSchema,
                }
                for tool in self.mcp_tools
            ]
            self.tools_by_name = {tool.name: tool for tool in self.mcp_tools}

    def action_clear_chat(self) -> None:
        if self.busy:
            self.query_one("#status", Static).update("Bitte warte, bis die Antwort fertig ist.")
            return
        self.history.clear()
        self.query_one("#chat", RichLog).clear()
        self.query_one("#status", Static).update("Verlauf geleert.")

    def on_input_submitted(self, event: Input.Submitted) -> None:
        prompt = event.value.strip()
        if not prompt:
            return

        event.input.value = ""
        event.input.disabled = True
        self.busy = True
        self.query_one("#status", Static).update("Antwort wird erstellt …")
        self.query_one("#chat", RichLog).write(Text(f"Du: {prompt}", style="bold cyan"))
        self.history.append({"role": "user", "content": prompt})
        self.run_worker(self._get_answer(), name="openai-response", exclusive=True)

    async def _execute_mcp_function_calls(
        self,
        response: Any,
        request_input: list[Any],
        chat: RichLog,
    ) -> bool:
        function_calls = [
            item for item in response.output if item.type == "function_call"
        ]
        if not function_calls:
            return False

        request_input.extend(response.output)
        async with streamable_http_client(MCP_SERVER_URL) as (
            read_stream,
            write_stream,
            _,
        ):
            async with ClientSession(read_stream, write_stream) as mcp_session:
                await mcp_session.initialize()
                for function_call in function_calls:
                    chat.write(Text(f"MCP-Aufruf: {function_call}"))
                    try:
                        arguments = json.loads(function_call.arguments)
                        if function_call.name not in self.tools_by_name:
                            raise ValueError("Unbekanntes MCP-Tool.")
                        tool_result = await mcp_session.call_tool(
                            function_call.name, arguments
                        )
                        result = "\n".join(
                            item.text
                            for item in tool_result.content
                            if hasattr(item, "text")
                        )
                        if tool_result.isError:
                            result = result or "MCP-Tool-Aufruf fehlgeschlagen."
                    except Exception as exc:
                        result = f"MCP-Tool-Aufruf fehlgeschlagen: {exc}"

                    request_input.append(
                        {
                            "type": "function_call_output",
                            "call_id": function_call.call_id,
                            "output": result,
                        }
                    )
        return True

    async def _get_answer(self) -> None:
        chat = self.query_one("#chat", RichLog)
        status = self.query_one("#status", Static)
        prompt_input = self.query_one("#prompt", Input)

        try:
            request_input = list(self.history)
            while True:
                response = await self.client.responses.create(
                    model=MODEL,
                    instructions=SYSTEM_PROMPT,
                    input=request_input,
                    tools=self.tools,
                    store=False,
                    reasoning={"effort": "none"},
                )

                if not await self._execute_mcp_function_calls(response, request_input, chat):
                    break

            answer = response.output_text.strip()
            if not answer:
                answer = "(Die API hat keinen Text zurückgegeben.)"

            self.history.append({"role": "assistant", "content": answer})
            while len(self.history) > MAX_HISTORY_MESSAGES:
                del self.history[:2]

            chat.write(Markdown(f"**KI**:{answer}"))
            usage = response.usage
            if usage is not None:
                input_details = getattr(usage, "input_tokens_details", None)
                output_details = getattr(usage, "output_tokens_details", None)
                cached_tokens = getattr(input_details, "cached_tokens", 0)
                reasoning_tokens = getattr(output_details, "reasoning_tokens", 0)
                chat.write(
                    Text(
                        f"Tokens: Eingang {usage.input_tokens} "
                        f"(Cache {cached_tokens}), Ausgabe {usage.output_tokens} "
                        f"(Reasoning {reasoning_tokens}), Gesamt {usage.total_tokens}",
                        style="dim",
                    )
                )
        except APIConnectionError:
            self.history.pop()
            chat.write(Text("Verbindungsfehler. Prüfe die Internetverbindung und versuche es erneut.", style="bold red"))
        except APIStatusError as exc:
            self.history.pop()
            chat.write(Text(f"API-Fehler ({exc.status_code}): {exc.message}", style="bold red"))
        except OpenAIError as exc:
            self.history.pop()
            chat.write(Text(f"OpenAI-Fehler: {exc}", style="bold red"))
        except Exception as exc:
            self.history.pop()
            details = "".join(traceback.format_exception(exc)).rstrip()
            chat.write(Text(f"MCP-/Eingabefehler:\n{details}", style="bold red"))
        finally:
            self.busy = False
            status.update("")
            prompt_input.disabled = False
            prompt_input.focus()

    async def on_unmount(self) -> None:
        await self.client.close()


def main() -> int:
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY ist nicht gesetzt.")
        print('PowerShell: $env:OPENAI_API_KEY = "dein-api-key"')
        return 1

    ChatApp().run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
