# PNMC Platform (Monorepo)

Este repositorio contiene la versión actual organizada para trabajo colaborativo y despliegue en Azure.

## Estructura

- `pnmc-web/`: frontend React (UI actual, sin rediseño).
- `pnmc-api/`: backend .NET 10 + Entity Framework Core.
- `pnmc-database/`: artefactos SQL versionables (schema/migrations/scripts).

## Fuente de verdad de datos

- La fuente de datos oficial es **Azure SQL**.
- No se suben credenciales al repositorio.
- No se suben datos sensibles ni dumps productivos.

## Variables de entorno requeridas

Backend (`pnmc-api/.env`, a partir de `.env.example`):

- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`
- `AZURE_SQL_ENCRYPT`
- `AZURE_SQL_TRUST_SERVER_CERTIFICATE`
- `AZURE_SQL_CONNECTION_STRING` (opcional)

Frontend (`pnmc-web/.env`, a partir de `.env.example`):

- `VITE_API_BASE_URL` (ejemplo: `http://localhost:8080`)

## Ejecución local

1. Backend:
```bash
cd pnmc-api
cp .env.example .env
# completar credenciales reales fuera de git
dotnet restore PNMC.Api.sln
dotnet run --project src/PNMC.Api/PNMC.Api.csproj
```

2. Frontend:
```bash
cd pnmc-web
npm install
npm run dev
```

## Entrega a otro desarrollador

1. Compartir acceso al repositorio en GitHub.
2. Compartir credenciales por canal seguro (1Password, Vault, etc.), nunca por commit.
3. Confirmar que puede abrir:
   - API: `http://localhost:8080/swagger`
   - Frontend: `http://localhost:5173`
