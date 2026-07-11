#!/bin/bash
# Serve the app over HTTP — most reliable way to run JS on iPad Safari.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "YOUR-MAC-IP")
PORT=8080
echo ""
echo "Ghoulsburg Cemetery — local server"
echo "  Mac:    http://127.0.0.1:$PORT"
echo "  iPad:   http://$IP:$PORT  (same Wi‑Fi)"
echo ""
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
