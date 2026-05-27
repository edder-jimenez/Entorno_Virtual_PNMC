#!/usr/bin/env bash
set -euo pipefail

# Obtener la ruta del directorio del script (donde está el proyecto)
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=================================================="
echo "        INICIANDO PLATAFORMA PNMC LOCAL           "
echo "=================================================="
echo ""

# 1. Verificar si Docker está abierto. Si no, abrirlo automáticamente.
if ! pgrep -x "Docker" > /dev/null; then
    echo "[pnmc] Docker Desktop no está ejecutándose. Iniciándolo..."
    open -a Docker
    echo "[pnmc] Esperando a que Docker termine de cargar..."
    until docker info >/dev/null 2>&1; do
        sleep 2
    done
fi

# 2. Levantar la base de datos local
echo "[pnmc] Asegurando que el contenedor de base de datos esté corriendo..."
./scripts/local-db-up.sh

# 3. Levantar backend y frontend en nuevas ventanas de terminal
echo "[pnmc] Abriendo terminales del Backend API y Frontend Vite..."

# Iniciar backend (.NET) con configuración local
osascript <<APPLESCRIPT
 tell application "Terminal"
   do script "cd '$DIR' && ./scripts/api-local.sh"
   activate
 end tell
APPLESCRIPT

# Iniciar frontend (React/Vite)
osascript <<APPLESCRIPT
 tell application "Terminal"
   do script "cd '$DIR/pnmc-web' && npm run dev -- --host 127.0.0.1 --port 5173"
   activate
 end tell
APPLESCRIPT

echo ""
echo "=================================================="
echo "¡Todo en marcha exitosamente!"
echo " -> Backend (API): http://localhost:8080/swagger"
echo " -> Frontend (Web): http://127.0.0.1:5173"
echo "=================================================="
echo ""
sleep 3
