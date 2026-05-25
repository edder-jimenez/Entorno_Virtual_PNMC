# PNMC Platform (Monorepo)

Repositorio preparado para continuidad de desarrollo y despliegue futuro en Azure sin romper el funcionamiento actual.

## Estructura recomendada para handoff

- `pnmc-web/`: frontend React (aplicación visual actual).
- `pnmc-api/`: backend .NET 10 + Entity Framework Core (API + reglas servidor).
- `pnmc-database/`: SQL versionable (`schema/`, `migrations/`, `scripts/`, `seed/`).
- `docs/internal/`: documentación técnica interna y checklist de calidad.
- `scripts/`: utilitarios de arranque local.
- `backups/`: material legado/no usado movido fuera del flujo activo. Esta carpeta está ignorada para GitHub.

## Contenido movido a backups

- `backups/legacy-code/`: páginas/componentes React antiguos o prototipos reemplazados por la versión final.
- `backups/legacy-angular/`: intento Angular archivado.
- `backups/orphans/`: archivos sueltos detectados fuera del flujo actual.
- `backups/archive-files/`: respaldos locales pesados (`.tar.gz`) fuera del flujo de desarrollo.
- `backups/context/`: artefactos de contexto local que no deben publicarse.

## Fuente oficial de datos

- Única fuente de verdad: **Azure SQL**.
- Frontend consume datos **solo vía backend** (`pnmc-api`).

## Variables de entorno

Backend (`pnmc-api/.env` desde `.env.example`):

- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`
- `AZURE_SQL_ENCRYPT`
- `AZURE_SQL_TRUST_SERVER_CERTIFICATE`
- `AZURE_SQL_CONNECTION_STRING` (opcional, tiene prioridad)

Frontend (`pnmc-web/.env` desde `.env.example`):

- `VITE_API_BASE_URL` (ejemplo `http://localhost:8080`)

## Levantar el proyecto

Opción rápida (recomendada):

```bash
./scripts/dev-up.sh
```

Opción manual:

1. Backend
```bash
cd pnmc-api
cp .env.example .env
dotnet restore PNMC.Api.sln
dotnet run --project src/PNMC.Api/PNMC.Api.csproj
```

2. Frontend
```bash
cd pnmc-web
npm install
npm run dev
```

## URLs de verificación

- Frontend: `http://127.0.0.1:5173`
- API Swagger: `http://localhost:8080/swagger`
- API Health: `http://localhost:8080/health/live`

## Base local con Docker

Para trabajar sin consumir Azure SQL:

```bash
./scripts/local-db-up.sh
./scripts/api-local.sh
```

La base local queda en SQL Server:

- Host: `127.0.0.1,14333`
- Database: `PNMC_LOCAL`
- User: `sa`

El API local fuerza esa conexion sin modificar `pnmc-api/.env`, asi que puedes conservar tus credenciales de Azure separadas. Ver detalles en `pnmc-database/local/README.md`.
