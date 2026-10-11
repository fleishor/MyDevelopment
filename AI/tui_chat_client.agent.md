# Coding practices
- Prefer simple, readable Python that follows existing conventions; use clear names, focused functions, and appropriate type annotations.
- Keep changes scoped to the request. Reuse existing dependencies and abstractions, and avoid generated-file edits or unrelated refactoring.
- Handle expected errors explicitly without silently swallowing them.
- Read configuration and credentials from environment variables or `.env`; never hard-code or log secrets or conversation data.
- When imports or dependencies change, update `requirements.txt` and the module docstring's setup instructions together.

# Application
- `tui_chat_client` is a terminal-based proof-of-concept chat client using Textual, Rich, and the OpenAI Responses API.
- The UI contains a header, a central log for messages, responses, tool-call diagnostics, errors, and token usage, plus bottom status, input, and keyboard-footer areas.

## Behavioral invariants
- Preserve the existing Textual structure and keep OpenAI requests asynchronous; never block the event loop with synchronous network calls.
- Treat `self.history` as the conversation source of truth. Add the user message before requesting, add the assistant message only after a response, and enforce `MAX_HISTORY_MESSAGES` by removing complete user/assistant pairs.
- Keep `store=False` unless server-side storage is explicitly requested. Preserve the `OPENAI_MODEL` and `OPENAI_SYSTEM_PROMPT` environment overrides.
- Keep `TOOLS` synchronized with the callable implementations and their strict JSON schemas. For a `function_call`, append the model output to the request input, execute the requested function with parsed arguments, append a matching `function_call_output`, and continue until a final assistant response is returned.
- Keep `read_file` limited to UTF-8 text-file reads. Return file or argument errors as tool output so the model can handle them; do not expose file contents or sensitive paths in diagnostic UI messages.
- While a request runs, disable input, reject chat clearing, and restore input/focus in `finally`. On OpenAI failures, remove the pending user message and write a user-visible error.
- Keep Rich Markdown for assistant output and plain `Text` for status, diagnostics, and errors. Treat usage details as optional and access SDK fields defensively.
- Close the asynchronous OpenAI client during app unmount. Keep user-facing shortcut text synchronized with `BINDINGS`.

## Change and validation rules
- Change the event handler, worker, or lifecycle method that owns a behavior instead of introducing parallel state. Preserve `main()` as the configuration check, app runner, and process-status entry point.
- For UI changes, check empty input, repeated submissions, idle/busy clearing, successful and empty responses, connection/status errors, and clean shutdown.
- After Python changes, run a syntax/compile check and, when dependencies are available, the narrowest relevant test or launch check without real credentials.
