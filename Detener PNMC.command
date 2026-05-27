#!/usr/bin/env bash
set -uo pipefail

echo "=================================================="
echo "         DETENIENDO PLATAFORMA PNMC               "
echo "=================================================="
echo ""

# 1. Detener Frontend (puerto 5173)
FRONTEND_PID=$(lsof -t -i :5173 || true)
if [ -n "$FRONTEND_PID" ]; then
    echo "[pnmc] Deteniendo servidor Frontend Vite..."
    kill $FRONTEND_PID
else
    echo "[pnmc] El servidor Frontend ya estaba apagado."
fi

# 2. Detener Backend (puerto 8080)
BACKEND_PID=$(lsof -t -i :8080 || true)
if [ -n "$BACKEND_PID" ]; then
    echo "[pnmc] Deteniendo servidor Backend API..."
    kill $BACKEND_PID
else
    echo "[pnmc] El servidor Backend ya estaba apagado."
fi

# 3. Detener la base de datos sin remover el contenedor
echo "[pnmc] Deteniendo contenedor de base de datos..."
docker compose -f docker-compose.local.yml stop

echo ""
echo "=================================================="
echo "¡Todo apagado con éxito!"
echo "-> Servidores web: Liberados"
echo "-> Base de datos: APAGADA (Visible en gris en Docker)"
echo "=================================================="
echo ""
sleep 3
