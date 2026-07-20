#!/usr/bin/env python3
"""Serve the bundled DOCCT site on localhost only and open the browser."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import threading
import webbrowser

HOST = "127.0.0.1"
PORT = 8765
SITE = Path(__file__).resolve().parent / "site"

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        requested = (SITE / self.path.lstrip("/").split("?", 1)[0]).resolve()
        if self.path != "/" and (SITE not in requested.parents or not requested.exists()):
            self.path = "/index.html"
        super().do_GET()

if __name__ == "__main__":
    os.chdir(SITE)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://{HOST}:{PORT}/"
    print(f"DOCCT is running locally at {url}")
    print("No internet connection is required. Press Ctrl+C to stop.")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping DOCCT.")
    finally:
        server.server_close()
