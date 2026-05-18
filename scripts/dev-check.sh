#!/usr/bin/env bash
set -euo pipefail

echo "== PNMC health check =="
echo -n "frontend: "
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5173 || true

echo -n "api live: "
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8080/health/live || true

echo -n "api ready: "
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:8080/health/ready || true
