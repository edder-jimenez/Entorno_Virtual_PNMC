# PNMC Platform (Monorepo)

Repositorio preparado para continuidad de desarrollo y despliegue futuro en Azure sin romper el funcionamiento actual.

## Estructura recomendada para handoff

- `pnmc-web/`: frontend React (aplicación visual actual).
- `pnmc-api/`: backend .NET 10 + Entity Framework Core (API + reglas servidor).
- `pnmc-database/`: SQL versionable (`schema/`, `migrations/`, `scripts/`, `seed/`).
- `docs/internal/`: documentación técnica interna y checklist de calidad.
- `scripts/`: utilitarios de arranque local.
- `Trash/`: material legado/no usado (no participa en ejecución actual).

## Contenido movido a Trash

- `Trash/legacy-angular/migracion-fallida/`: intento Angular archivado.
- `Trash/orphans/`: archivos sueltos huérfanos.
- `Trash/backups/`: respaldos locales pesados (`.tar.gz`) fuera del flujo de desarrollo.

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
