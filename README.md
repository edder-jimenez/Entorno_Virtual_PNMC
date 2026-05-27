# PNMC Platform (Monorepo)

> [!IMPORTANT]
> **DOCUMENTACIÓN DE ENTREGA Y TRASPASO TÉCNICO COMPLETA:**
> Se ha generado un **Manual Maestro de la Plataforma** que desglosa detalladamente la arquitectura monorepo (.NET 10 + React 19 + SQL Server), configuración de variables de entorno, guías de instalación, motor de escaneo geográfico, matrices de permisos y el onboarding de usuarios.
> **Por favor, consulte la documentación oficial en: [DOCUMENTACION_PROYECTO.md](docs/DOCUMENTACION_PROYECTO.md)**

Plataforma PNMC preparada para continuidad de desarrollo y despliegue futuro en Azure sin romper la experiencia visual actual. El repositorio está organizado como monorepo con frontend React/Vite, backend .NET y scripts SQL versionables.

## Estructura recomendada para handoff

- `pnmc-web/`: frontend React (aplicación visual actual).
- `pnmc-api/`: backend .NET 10 + Entity Framework Core (API + reglas servidor).
- `pnmc-database/`: SQL versionable (`schema/`, `migrations/`, `scripts/`, `seed/`).
- `docs/`: carpeta de documentación unificada organizada por carpetas temáticas.
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

## Stack actual

- Frontend: React 19, Vite 8, Tailwind CSS, React Router, Leaflet.
- Backend: .NET 10 Minimal APIs, Entity Framework Core, autenticación por cookie.
- Base de datos: SQL Server/Azure SQL con scripts versionables.
- Pruebas: Vitest/Testing Library para frontend y xUnit/integration tests para API.

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

No subir archivos `.env` reales. El `.gitignore` ignora `.env`, `.env.*`, `node_modules`, `dist`, `bin`, `obj`, respaldos y temporales.

## Levantar el proyecto

Opción rápida (recomendada):

```bash
./scripts/dev-up.sh
```

Opción manual:

1. Backend
```bash
./scripts/local-db-up.sh
./scripts/api-local.sh
```

Este comando usa SQL Server local en Docker:

- Host: `127.0.0.1,14333`
- Base: `PNMC_LOCAL`
- Usuario: `sa`

No uses `ASPNETCORE_ENVIRONMENT=Test` para revisar datos reales. Ese entorno levanta SQLite temporal con datos de prueba y solo debe usarse para pruebas automatizadas o validaciones aisladas.

Si necesitas inicializar o actualizar la estructura local:

```bash
./scripts/seed-local-db.sh
```

Credenciales locales, solo si la base fue sembrada con datos de desarrollo:

- Webmaster: `admin@pnmc.local` / `pnmc-master`
- Gestor interno: `gestor@pnmc.local` / `pnmc-gestor`
- Aliado: `aliado-admin@pnmc.local` / `pnmc-aliado`
- Externo: `externo@pnmc.local` / `pnmc-externo`

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

## Comandos disponibles

Frontend:

```bash
cd pnmc-web
npm install
npm run lint
npm run test
npm run build
npm run dev
npm run preview
```

Backend:

```bash
cd pnmc-api
dotnet restore PNMC.Api.sln
dotnet test PNMC.Api.sln
../scripts/api-local.sh
```

## Módulos principales

- Home y navegación pública.
- Agenda, noticias, galería y editorial/biblioteca.
- Mapa ecosistémico y formulario de participación.
- Administración: monitoreo, módulos de datos, entidades, revisión, usuarios y sistema.
- API pública por módulo y API administrativa protegida.
- Scripts de base de datos para maestras, administración, contenidos y datos de prueba.

## Flujo de datos

1. El frontend resuelve `VITE_API_BASE_URL` o usa proxy local de Vite.
2. Los servicios en `pnmc-web/src/services` centralizan llamadas al backend.
3. La API consulta SQL Server con EF Core y expone DTOs desde `PNMC.Contracts`.
4. Los formularios administrativos envían payloads normalizados al backend.
5. El formulario de participación usa el endpoint backend y conserva cola/borrador local como apoyo de usuario.

## Flujo de estados de registros

Estados oficiales:

- `borrador`
- `en_revision`
- `ajustes_solicitados`
- `aprobado`
- `publicado`
- `rechazado`
- `archivado`

`ajustes_solicitados` es un estado propio. El backend ya no lo normaliza como `en_revision`. Las transiciones administrativas registran historial en `RegistrosRevisionHistorial`.

## Roles previstos y Diferenciación de Usuarios

Para garantizar un control y gobernanza coherente, el sistema implementa una distinción fundamental entre dos tipos de accesos en el portal público:

1. **Colaboradores ("Los Externos"):**
   - **`externo`**: Participante o actor público independiente de la ciudadanía (artistas, lutieres independientes, gestores comunitarios). Se auto-registran desde el portal de colaboradores y su alcance operativo está limitado estrictamente a la postulación y seguimiento de sus propios registros. No forman parte de ninguna institución del PNMC.

2. **Aliados ("Entidades Aliadas"):**
   - Organizaciones formales, escuelas o corporaciones aliadas del PNMC. Sus usuarios operativos ingresan a través del mismo portal pero poseen privilegios compartidos y restringidos a su entidad mediante un identificador obligatorio (`EntidadAliadaId`). Sus subroles son:
     - **`aliado_admin`**: Administrador de la entidad aliada aprobada; gestiona el equipo de su entidad.
     - **`aliado_editor`**: Operador de la entidad aliada; crea, edita y envía registros a revisión.
     - **`aliado_lector`**: Usuario con permiso de solo lectura de los registros de su entidad.

3. **Roles Administrativos Internos (PNMC):**
   - **`webmaster`**: Administración total de la plataforma, logs de sistema, catálogos base, seguridad y control global de usuarios.
   - **`gestor_interno`**: Rol de moderación institucional. Revisa, audita y valida registros ecosistémicos en la bandeja de entrada, sin acceso a auditorías de sistema ni alta de usuarios globales.

Los roles históricos se migran mediante SQL incremental. No deben usarse como nombres activos en frontend, backend, seeds o nuevos datos.

## Pendientes técnicos y riesgos

- `xlsx` tiene vulnerabilidad conocida sin fix disponible en la versión pública usada; evaluar reemplazo o aislamiento del flujo de importación/exportación.
- `exceljs` arrastra vulnerabilidad moderada vía `uuid`; `npm audit fix --force` propone downgrade con cambio potencialmente rompedor.
- `AdminShellPage.jsx` concentra demasiada lógica y genera un chunk grande; conviene dividir por paneles después del handoff.
- La protección real de permisos depende del backend y de roles persistidos en SQL; no delegar seguridad al frontend.
- Las notificaciones internas ya tienen tabla y endpoints mínimos. Correo, WhatsApp, reportes ejecutivos, solicitudes de vinculación y panel externo completo siguen como fase posterior.

## Documentación de entrega y Handoff Técnico

La documentación oficial del PNMC se centraliza en el **Manual Maestro** y sus sub-documentos organizados por carpetas específicas:

* **[Manual Maestro del Proyecto](docs/DOCUMENTACION_PROYECTO.md)**: El punto de entrada principal con el mapa relacional e índices.
* `docs/tecnico/`: Guías de arranque rápido, arquitectura del monorepo, bases de datos y auditoría técnica inmutable.
* `docs/funcional/`: Fichas funcionales del portal público, CMS de textos dinámicos y geovisor del mapa.
* `docs/gobernanza/`: Manuales de roles y permisos (RBAC), convenios institucionales de Habeas Data y el motor de reclamaciones de registros huérfanos.
* `docs/backlog/`: Backlogs y checklists de deudas técnicas, blindaje de seguridad (hardening) y compatibilidad de accesibilidad WCAG 2.1 AA.

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
