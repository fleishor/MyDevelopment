"""Serve local UTF-8 .txt files over MCP at http://127.0.0.1:8080/mcp.

Start with: python mcp_file_server.py
The current working directory determines which files are accessible.
"""

from pathlib import Path
from datetime import datetime

from mcp.server.fastmcp import FastMCP


mcp = FastMCP("Local Text Files", host="127.0.0.1", port=8080)


@mcp.tool()
def read_file(path: str) -> str:
    """Read a UTF-8 .txt file directly inside the current working directory."""
    directory = Path.cwd().resolve()
    file_path = (directory / path).resolve()
    if file_path.parent != directory or file_path.suffix.lower() != ".txt":
        raise ValueError("Only .txt files in the current working directory are allowed.")
    return file_path.read_text(encoding="utf-8")


@mcp.tool()
def list_files() -> str:
    """List files in the current working directory with size and creation date."""
    files = sorted(
        (path for path in Path.cwd().iterdir() if path.is_file()),
        key=lambda path: path.name.casefold(),
    )
    if not files:
        return "Keine Dateien im aktuellen Verzeichnis gefunden."

    entries = ["Dateiname | Größe (Bytes) | Erstellungsdatum"]
    for file_path in files:
        metadata = file_path.stat()
        created = datetime.fromtimestamp(metadata.st_ctime).isoformat(
            sep=" ", timespec="seconds"
        )
        entries.append(f"{file_path.name} | {metadata.st_size} | {created}")
    return "\n".join(entries)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")