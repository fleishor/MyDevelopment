#!/bin/bash

PY_SCRIPT="/home/fleishor/Scripts/GenerateIndexForFolder.py"

find . -type d -exec bash -c '
  cd "$1" || exit
  python3 "'"$PY_SCRIPT"'"
' _ {} \;
