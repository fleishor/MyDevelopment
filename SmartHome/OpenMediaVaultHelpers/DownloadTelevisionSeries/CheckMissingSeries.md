**Guide lines for Python**
* Consider the guide line for python code generation from file ..\PythonGuideLines.md

**Task:**
* Generate a **single Python script** which checks for an existing JSON file whether there is also a MP4 video file with the same filename

**Input:**
* There are no input or command line parameters necessary.

**Processing and implementation notes:**

* The python script should iterate over the directory including subdirectories
* Take the current directory as starting point.
* The processing of the directories should be sorted
* In case it finds a JSON file it should also look for a MP4 file with the same name
* In case no suiteable MP4 file was found the filename of the JSON file should be written to stdout; 

