**Guide lines for Python**
* Consider the guide line for python code generation from file ..\PythonGuideLines.md

**Logging:**
  * Additionally to the logging from the PyhtonGuideLines.md consider the following
     * input file and output directory
     * total number of entries
     * per-file progress: `[current/total] created <filename>`

**Task:**
* Generate a **single Python script** that splits a JSON file into multiple files.

**Input:**

* The input JSON filename is provided as a **command-line argument**
* The JSON file contains an **array of objects**
* Each object has:

  * `seasonEpisode` formatted as `"season.episode"` (e.g. `"1.3"`)
  * `episodeName` (string)

**Processing rules:**

* Create one output JSON file per array element
* Output directory: `output` (create if missing)

**Filename format:**

```
S{season:02d}E{episode:02d}_{episodeName}.json
```

* Convert `seasonEpisode` → `SxxExx` (two digits, zero-padded)
* Replace spaces in `episodeName` with `_`
* Remove **all characters invalid for filenames**

  * Replace `ä` with `ae`, `ö` with `oe`, `ü` with `ue`, `ß` with `ss`, 
  * Otherwise allowed characters: `A–Z`, `a–z`, `0–9`, `_`, `-`
