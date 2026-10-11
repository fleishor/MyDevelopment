**Guide lines for Python**
* Consider the guide line for python code generation from file ..\PythonGuideLines.md

**Task:**
* Generate a **single Python script** that extract all series from fernsehserien.de and update the corresponding file in directory Metadata

**Input:**

* The input JSON filename is provided as a **command-line argument**
* The JSON file contains an **array of objects**
* Each object has:

  * `serienUrl` (string)
  * `serieFileName` (string)

**Processing and implementation notes:**

* Use the python library requests and BeautifulSoup for downloading and parsing the HTML page
* Input: the JSON filename is provided as a command-line argument and contains an array of objects with `serienUrl` and `serieFileName`.
* For each object, build the series episodenguide URL from base `https://www.fernsehserien.de/`, the `serienUrl`, and the path segment `episodenguide`. Use `urllib.parse.urljoin` or normalize path segments to avoid double slashes.
* Fetch the episodenguide page with library requests and parse HTML using the BeautifulSoup to locate elements where `data-event-category` equals `liste-episoden`; extract episode entries from those elements.
* Create an `Metadata` directory if missing and write one UTF-8 JSON file per series at `Metadata/{sanitized_serieFileName}.json`. 
* Sanitize `serieFileName` for filesystem safety (remove/replace Windows-illegal characters `<>:\"/\\|?*`). In case sanitized_serieFileName already contains the file extension .json do not add it again.
* In case the file `Metadata/{sanitized_serieFileName}.json` already exists, keep the existing entries and add new episode entries to the file
* The episode description should be only downloaded when the episode must be added to the file `Metadata/{sanitized_serieFileName}.json`; 
* A logging should be written in case when a episode must be added to the file `Metadata/{sanitized_serieFileName}.json`; 
