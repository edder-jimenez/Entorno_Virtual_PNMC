#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
DB_PORT="${PNMC_LOCAL_SQL_PORT:-14333}"

export ASPNETCORE_ENVIRONMENT=Local
export AZURE_SQL_CONNECTION_STRING="Server=127.0.0.1,$DB_PORT;Initial Catalog=$DB_NAME;Persist Security Info=False;User ID=sa;Password=$DB_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;"

cd "$ROOT_DIR/pnmc-api"
dotnet run --no-launch-profile --project src/PNMC.Api/PNMC.Api.csproj --urls http://127.0.0.1:8080
