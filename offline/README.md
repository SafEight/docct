# DOCCT Offline

This package contains the complete DOCCT game, including all JavaScript, CSS, fonts, voice packs, beep, and fart audio assets. It does not need an internet connection.

## Start on Windows

Double-click **Start DOCCT.bat**.

## Start on macOS

Right-click **Start DOCCT.command**, choose **Open**, and approve it once if macOS asks. If needed, run:

```sh
chmod +x "Start DOCCT.command"
```

## Start on Linux

Run:

```sh
./Start\ DOCCT.command
```

The launcher starts a server bound only to `127.0.0.1:8765` and opens the game in your default browser. It is not exposed to your local network or the internet. Press `Ctrl+C` in the launcher window to stop it.

Settings, history, and high scores are stored locally in that browser's localStorage for `http://127.0.0.1:8765`.
