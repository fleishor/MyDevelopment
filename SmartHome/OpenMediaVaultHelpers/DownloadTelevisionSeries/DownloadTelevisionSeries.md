**Guide lines for Python**
* Consider the guide line for python code generation from file ..\PythonGuideLines.md

**Task:**
* Generate a **single Python script** that extract all series from fernsehserien.de

**Input:**

* The input JSON filename is provided as a **command-line argument**
* The JSON file contains an **array of objects**
* Each object has:

  * `serienUrl` (string)
  * `serieFileName` (string)

**Processing and implementation notes:**

* Use the python libraray requests and BeautifulSoup for downloading and parsing the HTML page
* Input: the JSON filename is provided as a command-line argument and contains an array of objects with `serienUrl` and `serieFileName`.
* For each object, build the series episodenguide URL from base `https://www.fernsehserien.de/`, the `serienUrl`, and the path segment `episodenguide`. Use `urllib.parse.urljoin` or normalize path segments to avoid double slashes.
* Fetch the episodenguide page (standard library networking) and parse HTML using the standard `html.parser` to locate elements where `data-event-category` equals `liste-episoden`; extract episode entries from those elements.
* Create an `output` directory if missing and write one UTF-8 JSON file per series at `output/{sanitized_serieFileName}.json`. Sanitize `serieFileName` for filesystem safety (remove/replace Windows-illegal characters `<>:\"/\\|?*`).
* Constraints: use only the Python standard library, read/write UTF-8, structure script with `main()` and `if __name__ == '__main__'`.
* Logging: use `logging` to record start of processing and completion; log errors but continue processing remaining entries.
