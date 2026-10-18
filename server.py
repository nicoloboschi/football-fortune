#!/usr/bin/env python3
"""Serves the game and keeps the save in state.json, so it survives a new tunnel URL.
python3 server.py [port]"""
import http.server, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(ROOT, "state.json")
FILES = {"/": "index.html", "/index.html": "index.html", "/app.js": "app.js", "/game.js": "game.js", "/data.js": "data.js", "/art.js": "art.js"}


class H(http.server.BaseHTTPRequestHandler):
    def send(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/version":  # changes whenever a game file changes, so open pages can reload
            return self.send(200, str(max(os.path.getmtime(os.path.join(ROOT, f)) for f in set(FILES.values()))).encode())
        if path == "/api/state":
            return self.send(200, open(STATE, "rb").read()) if os.path.exists(STATE) else self.send(404, b"null")
        if path not in FILES:  # only the game's own files, nothing else from disk
            return self.send(404, b"not found", "text/plain")
        ctype = "text/html; charset=utf-8" if path.endswith((".html", "/")) else "text/javascript; charset=utf-8"
        self.send(200, open(os.path.join(ROOT, FILES[path]), "rb").read(), ctype)

    def do_PUT(self):
        n = int(self.headers.get("Content-Length", 0))
        if self.path != "/api/state" or not 0 < n <= 4_000_000:
            return self.send(400, b"bad request", "text/plain")
        body = self.rfile.read(n)
        with open(STATE + ".tmp", "wb") as f:
            f.write(body)
        os.replace(STATE + ".tmp", STATE)
        self.send(204)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
