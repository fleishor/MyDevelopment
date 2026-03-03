"""Generate a simple filterable/sortable HTML index for a directory.

Usage: python GenerateIndexForFolder.py [directory] -o index.html

The generated HTML includes client-side JS for tokenized wildcard filtering
and column sorting. MP4 files will be probed with `ffprobe` (2s timeout)
to extract resolution when available.
"""

from __future__ import annotations

import argparse
import os
import datetime
import html
import subprocess
import logging
from typing import Optional, Tuple, Set

DEFAULT_OUTPUT = "index.html"
DEFAULT_IGNORE_FILES = {"index.html"}
DEFAULT_IGNORE_EXTS = {".pyc", ".tmp", ".json"}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate HTML index for a folder")
    p.add_argument("directory", nargs="?", default=".", help="Directory to index")
    p.add_argument("-o", "--output", default=DEFAULT_OUTPUT, help="Output HTML file")
    p.add_argument("--ignore-file", action="append", help="Filename to ignore (can be repeated)")
    p.add_argument("--ignore-ext", action="append", help="File extension to ignore (e.g. .json). Can be repeated")
    return p.parse_args()


def get_mp4_resolution(path: str, timeout: float = 2.0) -> Tuple[Optional[int], Optional[int]]:
    """Return (width, height) for an mp4 file using ffprobe, or (None, None)."""
    try:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        out = proc.stdout.strip().splitlines()
        if len(out) >= 2:
            w = int(out[0])
            h = int(out[1])
            return w, h
    except Exception:
        logging.getLogger(__name__).debug("ffprobe failed for %s", path, exc_info=True)
    return None, None


def sizeof_fmt(num: int) -> str:
    for unit in ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]:
        if abs(num) < 1024.0:
            return f"{num:3.1f} {unit}" if unit != "B" else f"{num} {unit}"
        num /= 1024.0
    return f"{num:.1f} PiB"


def build_index(directory: str, output_file: str, ignore_files: Optional[Set[str]] = None, ignore_exts: Optional[Set[str]] = None) -> bool:
    """Build the HTML index and write it to `output_file`. Returns True on success."""
    logger = logging.getLogger(__name__)

    ignore_files = set(ignore_files or [])
    ignore_exts = set((e.lower() if e.startswith('.') else f'.{e.lower()}') for e in (ignore_exts or []))

    # Log start and inputs (exact wording per prompt examples)
    logger.info("Start processing")
    logger.info("Input directory: %s", directory)
    logger.info("Output file: %s", output_file)

    try:
        entries_all = sorted(os.listdir(directory))
    except Exception:
        logger.exception("Failed to list directory: %s", directory)
        return False

    entries = []
    for n in entries_all:
        if n in ignore_files:
            logger.debug("Ignored filename: %s", n)
            continue
        ext = os.path.splitext(n)[1].lower()
        if ext in ignore_exts:
            logger.debug("Ignored extension: %s", n)
            continue
        entries.append(n)

    # Parent entry
    try:
        parent_path = os.path.abspath(os.path.join(directory, '..'))
        have_parent = os.path.abspath(directory) != parent_path
    except Exception:
        have_parent = False

    total = len(entries) + (1 if have_parent else 0)
    logger.info("Total entries: %d", total)

    rows = []
    idx = 1

    if have_parent:
        try:
            p_stat = os.stat(parent_path)
            p_mtime = datetime.datetime.fromtimestamp(p_stat.st_mtime)
            p_mtime_sort = int(p_stat.st_mtime)
        except Exception:
            p_stat = None
            p_mtime = datetime.datetime.now()
            p_mtime_sort = int(p_mtime.timestamp())
        name = ".."
        rows.append(f"""
<tr data-name="{html.escape(name).lower()}" data-isdir="1">
  <td><span class="icon">📁</span> <a href="../">{html.escape(name)}</a></td>
  <td data-sort="{-1}">-</td>
  <td data-sort="{0}">-</td>
  <td data-sort="{p_mtime_sort}">{p_mtime.strftime('%Y-%m-%d %H:%M')}</td>
</tr>
""")
        logger.info("[%d/%d] added <%s>", idx, total, name)
        idx += 1

    # directories first, then files
    entries_sorted = sorted(entries, key=lambda n: (not os.path.isdir(os.path.join(directory, n)), n.lower()))

    for name in entries_sorted:
        path = os.path.join(directory, name)
        try:
            stat = os.stat(path)
            mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
            mtime_sort = int(stat.st_mtime)
        except Exception:
            logger.exception("Failed to stat: %s", path)
            stat = None
            mtime = datetime.datetime.now()
            mtime_sort = int(mtime.timestamp())

        is_dir = os.path.isdir(path)
        if is_dir:
            size_sort = -1
            size_text = "-"
            href = name.rstrip('/') + '/'
        else:
            size_sort = stat.st_size if stat else 0
            size_text = sizeof_fmt(stat.st_size) if stat else "-"
            href = name

        resolution_text = "-"
        resolution_sort = 0
        ext = os.path.splitext(name)[1].lower()
        if not is_dir and ext == ".mp4":
            w, h = get_mp4_resolution(path)
            if w and h:
                resolution_text = f"{w}×{h}"
                resolution_sort = w * h
            else:
                logger.debug("No resolution for %s", name)

        rows.append(f"""
<tr data-name="{html.escape(name).lower()}" data-isdir="{1 if is_dir else 0}">
  <td><span class="icon">{'📁' if is_dir else '📄'}</span> <a href="{html.escape(href)}">{html.escape(name)}</a></td>
  <td data-sort="{size_sort}">{size_text}</td>
  <td data-sort="{resolution_sort}">{resolution_text}</td>
  <td data-sort="{mtime_sort}">{mtime.strftime('%Y-%m-%d %H:%M')}</td>
</tr>
""")
        logger.info("[%d/%d] added <%s>", idx, total, name)
        idx += 1

    body = "\n".join(rows)
    current_dir_display = html.escape(os.path.abspath(directory))

    html_content = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Verzeichnisinhalt</title>
<style>
body {{ font-family: Arial, sans-serif; }}
.controls {{ margin: 12px 0; }}
input[type="text"] {{ padding: 8px; width: 380px; max-width: 95vw; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ padding: 8px; border-bottom: 1px solid #ccc; text-align: left; }}
th {{ background: #f0f0f0; cursor: pointer; user-select: none; }}
.small {{ color: #666; font-size: 0.9em; }}
.icon {{ display: inline-block; width: 1.4em; }}
.sort-arrow {{ margin-left: 6px; color: #555; font-size: 0.9em; }}
code {{ background: #f6f6f6; padding: 2px 6px; border-radius: 4px; }}
</style>
<script>
function escapeRegex(s) {{ return s.replace(/[.*+?^${{}}()|[\]\/]/g, '\\$&'); }}
function wildcardToRegex(token) {{ const escaped = escapeRegex(token).replace(/\\\*/g, '.*'); return new RegExp('^' + escaped + '$', 'i'); }}
function tokenize(query) {{ const tokens = []; const re = /"([^\"]+)"|(\S+)/g; let m; while ((m = re.exec(query)) !== null) {{ tokens.push((m[1] || m[2]).trim()); }} return tokens.filter(t => t.length > 0); }}
function buildMatcher(query) {{ query = (query || '').trim(); if (!query) return () => true; const tokens = tokenize(query); const matchers = tokens.map(t => {{ if (t.includes('*')) {{ const r = wildcardToRegex(t); return (name) => r.test(name); }} const lower = t.toLowerCase(); return (name) => name.toLowerCase().includes(lower); }}); return (name) => matchers.every(fn => fn(name)); }}
function filterByName() {{ const input = document.getElementById("nameFilter"); const tbody = document.getElementById("fileTable").tBodies[0]; const matcher = buildMatcher(input.value); for (const row of tbody.rows) {{ const name = row.dataset.name || ""; row.style.display = matcher(name) ? "" : "none"; }} }}
function updateSortArrows(activeCol, asc) {{ document.querySelectorAll(".sort-arrow").forEach(a => a.textContent = ""); const arrow = document.querySelector(`[data-arrow-col="${{activeCol}}"]`); if (arrow) arrow.textContent = asc ? "▲" : "▼"; }}
function sortTable(col, numeric=false) {{ const table = document.getElementById("fileTable"); const tbody = table.tBodies[0]; const rows = Array.from(tbody.rows); const asc = (table.dataset.sortCol == col && table.dataset.sortDir == "asc") ? false : true; rows.sort((a, b) => {{ const aDir = Number(a.dataset.isdir || 0); const bDir = Number(b.dataset.isdir || 0); if (aDir !== bDir) return bDir - aDir; let A = a.cells[col].dataset.sort ?? a.cells[col].innerText; let B = b.cells[col].dataset.sort ?? b.cells[col].innerText; if (numeric) {{ A = Number(A); B = Number(B); }} else {{ A = String(A).toLowerCase(); B = String(B).toLowerCase(); }} if (A === B) return 0; return asc ? (A > B ? 1 : -1) : (A < B ? 1 : -1); }}); rows.forEach(r => tbody.appendChild(r)); table.dataset.sortCol = col; table.dataset.sortDir = asc ? "asc" : "desc"; updateSortArrows(col, asc); }}
</script>
</head>
<body>
<h1>Verzeichnisinhalt: <code>{current_dir_display}</code></h1>
<div class="controls">
  <input id="nameFilter" type="text" placeholder='Filter: e.g. "report 2024"  *.pdf' oninput="filterByName()">
  <div class="small">Multiple terms = AND · Wildcards with <code>*</code> · Click columns to sort · Folders always on top</div>
</div>
<table id="fileTable">
<thead>
<tr>
  <th onclick="sortTable(0)">Name <span class="sort-arrow" data-arrow-col="0"></span></th>
  <th onclick="sortTable(1, true)">Size <span class="sort-arrow" data-arrow-col="1"></span></th>
  <th onclick="sortTable(2, true)">Resolution <span class="sort-arrow" data-arrow-col="2"></span></th>
  <th onclick="sortTable(3, true)">Modified <span class="sort-arrow" data-arrow-col="3"></span></th>
</tr>
</thead>
<tbody>
{body}
</tbody>
</table>
</body>
</html>
"""

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info("Completed: wrote <%s>", output_file)
        return True
    except Exception:
        logger.exception("Failed to write output file: %s", output_file)
        return False


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

    ignore_files = set(DEFAULT_IGNORE_FILES) | set(args.ignore_file or [])
    ignore_exts = set(DEFAULT_IGNORE_EXTS) | set(args.ignore_ext or [])

    ok = build_index(args.directory, args.output, ignore_files=ignore_files, ignore_exts=ignore_exts)
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
