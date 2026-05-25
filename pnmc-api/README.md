# pnmc-api

Backend oficial de PNMC con .NET 10 + Entity Framework Core sobre SQL Server.

En desarrollo local, el backend consulta directamente el modelo reconstruido en
espanol (`Agenda`, `Noticias`, `Festivales`, `EscuelasMusica`,
`MercadosMusicales`, `RedesDocumentacion`, `Lutieres`, etc.). No depende de
vistas de compatibilidad con nombres anteriores.

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

Opciones de bootstrap (`appsettings*.json`, sección `Database`):
- `EnsureSupportTables`: crea/verifica tablas de soporte (participación).
- `StartupTimeoutSeconds`: tiempo máximo de espera al conectar SQL durante arranque.
- `ContinueOnStartupFailure`: si `true`, el API inicia en modo degradado aunque SQL no esté disponible temporalmente.

## Ejecutar local

```bash
cd pnmc-api
cp .env.example .env   # completa valores reales
dotnet restore PNMC.Api.sln
dotnet run --project src/PNMC.Api/PNMC.Api.csproj
```

Para trabajar contra la base local Docker del proyecto, desde la raiz del
repositorio usa:

```bash
./scripts/api-local.sh
```

Swagger: `http://localhost:8080/swagger`
Health: `http://localhost:8080/health/live` y `http://localhost:8080/health/ready`

Nota: si Azure SQL está en auto-pause, la primera conexión puede tardar unos segundos mientras despierta la base.

## Endpoints clave

- Noticias:
  - `GET /api/v1/news/articles`
  - `GET /api/v1/news`
- Editorial:
  - `GET /api/v1/editorial/resources`
  - `GET /api/v1/editorial`

## Pruebas

```bash
cd pnmc-api
dotnet test PNMC.Api.sln
```
