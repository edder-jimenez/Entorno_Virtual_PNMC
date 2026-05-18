# pnmc-database

Repositorio de artefactos SQL para PNMC sobre Azure SQL (`PNMC_DB`).

## Estructura

- `schema/`: definición de tablas, vistas y constraints por dominio.
- `migrations/`: scripts incrementales versionados (`VYYYYMMDD__descripcion.sql`).
- `seed/`: semillas opcionales para catálogos base no sensibles.
- `scripts/`: utilidades de despliegue, validación y rollback asistido.

## Criterio adoptado

Se usa repo separado para base de datos porque PNMC ya está en Azure SQL y la evolución de esquema debe versionarse y desplegarse de forma independiente al backend/frontend.

## Convenciones mínimas

1. Nunca hardcodear credenciales en scripts.
2. Scripts idempotentes cuando aplique.
3. Todo cambio de esquema debe pasar por `migrations/`.
4. El backend (`pnmc-api`) consume SQL exclusivamente a través de Entity Framework Core.

## Ejecución recomendada

1. Aplicar migraciones en orden lexicográfico:
   - `migrations/V20260428_01__baseline_indexes.sql`
   - `migrations/V20260428_02__baseline_constraints.sql`
2. Ejecutar validaciones de calidad de datos:
   - `scripts/data_quality_audit.sql`
