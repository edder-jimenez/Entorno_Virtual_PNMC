# pnmc-api

Backend oficial de PNMC con .NET 10 + Entity Framework Core sobre Azure SQL.

## Estructura

- `src/PNMC.Api`: capa HTTP (Minimal APIs, endpoints, configuración web).
- `src/PNMC.Application`: capa de aplicación (base para casos de uso).
- `src/PNMC.Domain`: entidades de dominio.
- `src/PNMC.Infrastructure`: acceso a datos, EF Core, integraciones y middleware técnico.
- `src/PNMC.Contracts`: DTOs y contratos de API.
- `tests/PNMC.Api.Tests`: pruebas de integración.
- `contracts/openapi.yaml`: contrato OpenAPI inicial.

## Configuración de entorno

Crear variables de entorno desde `.env.example`:

- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_USER`
- `AZURE_SQL_PASSWORD`
- `AZURE_SQL_ENCRYPT`
- `AZURE_SQL_TRUST_SERVER_CERTIFICATE`
- `AZURE_SQL_CONNECTION_STRING` (opcional, tiene prioridad)

No hardcodear credenciales en código ni en `appsettings`.
La API carga automáticamente un archivo `.env` local ubicado en `pnmc-api/.env` (o en carpetas padre), por lo que no necesitas exportarlas manualmente en cada terminal.

## Ejecutar local

```bash
cd pnmc-api
cp .env.example .env   # completa valores reales
dotnet restore PNMC.Api.sln
dotnet run --project src/PNMC.Api/PNMC.Api.csproj
```

Swagger: `http://localhost:8080/swagger`
Health: `http://localhost:8080/health/live`

## Pruebas

```bash
cd pnmc-api
dotnet test PNMC.Api.sln
```
