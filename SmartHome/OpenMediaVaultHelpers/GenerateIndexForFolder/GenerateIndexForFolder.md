**Guide lines for Python**
* Consider the guide line for python code generation from file ..\PythonGuideLines.md

**Task:**
* Generate a **single Python script** that builds an HTML index for a directory.

**Input / CLI:**
* Accept optional command-line arguments:
  * first positional argument: directory to index (default `.`)
  * optional `--output` / `-o` to set output filename (default `index.html`)
  * optional `--ignore-file` to add a filename to ignore (may be repeatable)
  * optional `--ignore-ext` to add an extension to ignore (may be repeatable)
* If no CLI is used, default values apply.

**Behavior / Processing rules:**
* Read the target directory (non-recursive) and gather for each entry:
  * name
  * whether it is a directory
  * size in bytes (for files)
  * modification time
  * for `.mp4` files, attempt to get video resolution (width × height) by calling `ffprobe` (use `subprocess.run`), capture output, and parse width and height; use a 2-second timeout for `ffprobe` and handle errors gracefully
* Ignore .json files in the directory
* Provide a parent (`..`) entry at the top when the target directory is not the filesystem root; include its modification time where available
* Filter out entries matching configured ignore filenames or extensions (case-insensitive for extensions)
* Sort entries alphabetically but ensure directories appear above files
* Build an HTML file (UTF-8) containing a table of entries with columns: Name, Size, Resolution, Modified
  * Size should be shown in a human-friendly format (e.g., `1.2 MB`) and include a numeric `data-sort` attribute for correct numeric sorting
  * Resolution column should show `WxH` when available and provide numeric `data-sort` (e.g., width * height) for sorting
  * Modified column should display `YYYY-MM-DD HH:MM` and provide `data-sort` with the epoch timestamp
* The generated HTML must include small embedded JavaScript for:
  * client-side filter input supporting tokens and `*` wildcards (wildcard `*` matches any sequence)
  * sorting by clicking table headers (toggle asc/desc)
  * keeping directories always sorted above files
* Escape HTML special characters for file/dir names

**Filename / Output requirements:**
* The script writes the HTML to the specified output filename (default `index.html`) using UTF-8
* The script must not execute any code on import (all logic inside `main()`)

**Performance / robustness:**
* Use efficient I/O (do not read large files)
* For `ffprobe` failures or timeouts, log a debug/warn message and leave resolution blank
* Handle `os.stat` failures per entry by logging and skipping or filling sensible defaults

**Examples of required log messages:**
* `Start processing` at start
* `Input directory: <dir>` and `Output file: <file>`
* `Total entries: <n>`
* `[3/42] added <Some File.mp4>` for each added entry
* `Completed: wrote <index.html>` on success
