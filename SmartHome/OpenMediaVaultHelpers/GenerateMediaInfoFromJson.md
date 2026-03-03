**System / Developer Instruction:**
* You are a senior Python engineer. 
* Produce clean, production-ready code. Be concise and deterministic.
* Produce a single Python file named `GenerateMediaInfoFromJson.py`.

**Strict mode (for CI / deterministic output):**

* Do not ask clarifying questions
* Add comments for better understand of the code and thoughts
* Assume valid input JSON
* No markdown formatting
* Output code only

**Logging:**

* Use Python’s `logging` module
* Log:
  * start of processing
  * input file and output directory
  * total number of entries
  * per-file progress: `[current/total] created <filename>`
  * completion message
* Errors must be logged and processing should continue

**Constraints:**

* Python standard library only
* UTF-8 encoding
* Structured with `main()` and protected by `if __name__ == '__main__'`
* No external dependencies

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


**Output:**
Return **only the complete Python script**, no explanations.
