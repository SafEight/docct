#!/bin/sh
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 server.py
fi
printf '%s\n' 'Python 3 is required to launch DOCCT locally.'
printf '%s\n' 'Install Python 3, then run this file again.'
printf 'Press Enter to close...'
read _
