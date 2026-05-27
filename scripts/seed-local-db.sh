#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
DB_PORT="${PNMC_LOCAL_SQL_PORT:-14333}"

echo "[pnmc-db] Detectando sqlcmd..."
SQLCMD=""
SQLCMD_MODE=""
if command -v sqlcmd >/dev/null 2>&1 \
  && sqlcmd -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="$(command -v sqlcmd)"
  SQLCMD_MODE="host"
elif docker exec pnmc-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
  SQLCMD_MODE="container"
elif docker exec pnmc-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
  SQLCMD_MODE="container"
fi

if [[ -z "$SQLCMD" ]]; then
  echo "[pnmc-db] Error: No se pudo conectar a SQL Server o no se encontró sqlcmd."
  exit 1
fi

echo "[pnmc-db] sqlcmd detectado en: $SQLCMD"

run_sql_file() {
  local file_path="$1"
  if [[ "$SQLCMD_MODE" == "host" ]]; then
    (cat "$file_path"; echo ""; echo "GO") | "$SQLCMD" -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b
  else
    (cat "$file_path"; echo ""; echo "GO") | docker exec -i pnmc-sqlserver "$SQLCMD" \
      -S localhost -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b
  fi
}

run_sql_query() {
  local query="$1"
  if [[ "$SQLCMD_MODE" == "host" ]]; then
    "$SQLCMD" -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -Q "$query"
  else
    docker exec -i pnmc-sqlserver "$SQLCMD" \
      -S localhost -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b \
      -Q "$query"
  fi
}

# Lista de esquemas a aplicar
SCHEMAS=(
  "schema/V20260519_01__maestras_estaticas.sql"
  "schema/V20260519_02__administracion_control.sql"
  "schema/V20260519_03__contenidos_modulos.sql"
  "schema/V20260519_04__articulacion_lectura_comun.sql"
  "schema/V20260521_01__entidades_administrativas.sql"
  "schema/V20260525_01__administracion_extendida.sql"
  "schema/V20260525_02__roles_finales_y_aliados.sql"
  "schema/V20260525_03__notificaciones.sql"
  "schema/V20260525_04__vinculacion_duplicados_calidad.sql"
)

# Lista de semillas a aplicar
SEEDS=(
  "seed/V20260519_01__maestras_estaticas_seed.sql"
  "seed/V20260519_02__divipola_seed.sql"
  "seed/V20260519_03__administracion_control_seed.sql"
  "seed/V20260519_04__contenidos_modulos_seed.sql"
  "seed/V20260519_05__articulacion_lectura_comun_seed.sql"
  "seed/V20260519_06__datos_prueba_amplios.sql"
  "seed/V20260519_07__datos_moderacion_consola.sql"
)

echo "[pnmc-db] Aplicando archivos de esquema..."
for schema in "${SCHEMAS[@]}"; do
  echo "  -> Aplicando $schema..."
  run_sql_file "$ROOT_DIR/pnmc-database/$schema"
done

echo "[pnmc-db] Aplicando archivos de semilla..."
for seed in "${SEEDS[@]}"; do
  echo "  -> Aplicando $seed..."
  run_sql_file "$ROOT_DIR/pnmc-database/$seed"
done

echo "[pnmc-db] Actualizando métricas del mapa..."
run_sql_query "EXEC dbo.sp_ActualizarMetricasMapa;"

echo "[pnmc-db] Base de datos local inicializada y sembrada con éxito."
