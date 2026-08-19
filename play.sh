#!/usr/bin/env bash
# ============================================================
#   JUJUTSU BATTLEGROUNDS - localhost launcher (macOS / Linux)
#   Run:  ./play.sh      (chmod +x play.sh the first time)
#   Installs dependencies on first run, starts the dev server
#   on http://localhost:5173 and opens your browser.
# ============================================================
set -e
cd "$(dirname "$0")"

echo
echo "  =========================================="
echo "    JUJUTSU BATTLEGROUNDS"
echo "    http://localhost:5173"
echo "  =========================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "  ERROR: Node.js was not found on your PATH."
  echo "  Install Node 18 or newer from https://nodejs.org and run this again."
  exit 1
fi

# Already running? Just open a tab rather than failing on the port.
if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "  A server is already listening on port 5173. Opening the game..."
  (command -v open >/dev/null 2>&1 && open "http://localhost:5173") \
    || (command -v xdg-open >/dev/null 2>&1 && xdg-open "http://localhost:5173") \
    || echo "  Open http://localhost:5173 in your browser."
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "  Installing dependencies (first run only, this may take a minute)..."
  echo
  npm install
  echo
fi

echo "  Game    http://localhost:5173"
echo "  Viewer  http://localhost:5173/#viewer"
echo
echo "  Press Ctrl+C to stop the server."
echo
exec npm run start
