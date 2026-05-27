#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[pnmc] Iniciando backend (.NET) en nueva terminal..."
osascript <<APPLESCRIPT
 tell application "Terminal"
   do script "cd '$ROOT_DIR' && ./scripts/local-db-up.sh && ./scripts/api-local.sh"
   activate
 end tell
APPLESCRIPT

echo "[pnmc] Iniciando frontend (Vite) en nueva terminal..."
osascript <<APPLESCRIPT
 tell application "Terminal"
   do script "cd '$ROOT_DIR/pnmc-web' && npm run dev -- --host 127.0.0.1 --port 5173"
   activate
 end tell
APPLESCRIPT

echo "[pnmc] Servicios iniciados"
echo "Frontend: http://127.0.0.1:5173"
echo "API: http://localhost:8080/swagger"
