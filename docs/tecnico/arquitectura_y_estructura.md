# ARQUITECTURA Y ESTRUCTURA DEL MONOREPO

Este sub-documento detalla la arquitectura de software del monorepo **PNMC (Plan Nacional de Música para la Convivencia)**, la organización física del código fuente y el diseño estructural de persistencia.

---

## 1. VISTA DE CONTENEDORES Y RELACIONES MACRO

La plataforma está diseñada bajo un modelo desacoplado de tres capas lógicas:

```
┌─────────────────────────────────┐
│     CLIENTE FRONTEND (Vite)     │
│ React 19 + Tailwind CSS + Axios │
└────────────────┬────────────────┘
                 │
                 │ Consumo API RESTful (JSON)
                 ▼
┌─────────────────────────────────┐
│     SERVIDOR BACKEND (.NET 10)  │
│ Minimal APIs + Entity Framework │
└────────────────┬────────────────┘
                 │
                 │ Consultas Seguras ADO.NET / LINQ
                 ▼
┌─────────────────────────────────┐
│    BASE DE DATOS (SQL Server)   │
│ Tablas, Constraints e Índices  │
└─────────────────────────────────┘
```

---

## 2. ESTRUCTURA COMPLETA DEL REPOSITORIO

La distribución de directorios en la raíz del monorepo sigue los principios de cohesión modular y desacoplamiento de dependencias:

```
/ (Raíz del Monorepo)
├── pnmc-web/               # APLICACIÓN FRONTEND (React 19 + Vite 8 + Tailwind CSS)
│   ├── src/
│   │   ├── app/            # Shell global, ruteo y provisión de contexto de sesión
│   │   ├── components/     # Layout y UI reutilizable (Badge, FormControls)
│   │   ├── features/       # Módulos por dominio (home, agenda, mapa, admin)
│   │   │   ├── admin/      # CMS de textos, cola de revisión, gestión de aliados
│   │   │   ├── content/    # Subpáginas de ejes y estrategias
│   │   │   ├── gallery/    # Memorias visuales y álbumes
│   │   │   ├── map/        # Mapa ecosistémico en Leaflet y sus sub-paneles
│   │   │   └── participation/ # Wizard de caracterización y registro ciudadano
│   │   ├── services/       # Clientes Axios y APIs de conexión
│   │   └── hooks/          # React Hooks compartidos
│   └── .env.example        # Referencia de variables de entorno del frontend
│
├── pnmc-api/               # BACKEND SERVER (Minimal APIs en .NET 10 + EF Core)
│   ├── src/
│   │   ├── PNMC.Api        # Program.cs, middlewares de seguridad, CORS y controladores
│   │   ├── PNMC.Contracts  # Contratos DTO de entrada y salida
│   │   ├── PNMC.Domain     # Modelos lógicos, enums y entidades del plan
│   │   └── PNMC.Infrastructure # DB Context de EF Core, auditorías e integraciones
│   └── .env.example        # Referencia de variables de entorno del backend
│
├── pnmc-database/          # BASE DE DATOS VERSIONABLE (SQL Server)
│   ├── schema/             # Scripts SQL de definición (DDL) de tablas por dominio
│   ├── seed/               # Datos maestros e inyecciones iniciales idempotentes
│   └── migrations/         # Baseline de índices, triggers y constraints de seguridad
│
├── docs/                   # CARPETA DE DOCUMENTACIÓN TÉCNICA
│   ├── tecnico/            # Guías de arranque, arquitectura y auditoría
│   ├── funcional/          # Fichas de portal público, CMS y mapa
│   ├── gobernanza/         # Manuales de roles, reclamación y Habeas Data
│   └── backlog/            # Pendientes de accesibilidad y deudas técnicas
│
└── docker-compose.local.yml # Orquestación Docker para SQL Server
```

---

## 3. DISEÑO DETALLADO DEL MODELO DE BASE DE DATOS

La persistencia del PNMC se organiza en tres familias relacionales en **SQL Server / Azure SQL** para garantizar un óptimo rendimiento e inmutabilidad:

```
               ┌──────────────────────────────────────────────┐
               │              PNMC SCHEMA (TABLAS)            │
               └──────────────────────┬───────────────────────┘
                                      │
       ┌──────────────────────────────┼───────────────────────────────┐
       ▼                              ▼                               ▼
[Tablas de Módulos]        [Tablas de Gobernanza]          [Tablas del Sistema]
- Festivales               - SolicitudesAliado             - WebTexts (CMS)
- EscuelasMusica           - SolicitudesVinculacion        - Usuarios
- Lutieres                 - RegistrosRevisionHistorial    - Notificaciones
- RedesDocumentacion       - CandidatosDuplicados
- Agenda / Noticias        - CalidadDatosFlags
```

### 3.1 Tablas de Contenido y Marcadores
* **`EscuelasMusica`**: Almacena capacidad estudiantil, tipos de instrumentos impartidos (vientos, cuerdas, percusión), director responsable y geolocalización.
* **`Festivales`**: Contiene periodicidad, fecha anual de realización, enlaces del sitio web del organizador y presupuesto histórico.
* **`Lutieres`**: Catálogo de constructores y reparadores de instrumentos tradicionales, especialidades en lutería y detalles de contacto.
* **`RedesDocumentacion`**: Registra centros de investigación, redes académicas y archivos musicales del territorio.
* **`Agenda` / `Noticias`**: Módulos que alimentan la interfaz pública (eventos culturales y comunicados oficiales).

### 3.2 Tablas de Gobernanza y Auditoría
* **`SolicitudesAliado`**: Registra las postulaciones de instituciones externas solicitando el estatus de Entidad Aliada.
* **`SolicitudesVinculacion`**: Centraliza las reclamaciones enviadas por Colaboradores Externos sobre registros históricos huérfanos.
* **`RegistrosRevisionHistorial`**: Tabla inmutable que actúa como auditoría (bitácora de auditoría legal) para registrar la fecha, el usuario, la acción y el estado anterior/nuevo de cada transición de registro ecosistémico.
* **`CandidatosDuplicados`**: Algoritmo server-side que inserta alertas cuando detecta dos registros con nombres similares en el mismo municipio.
* **`CalidadDatosFlags`**: Banderas automáticas de aviso ante inconsistencias físicas de datos (ej. coordenadas inválidas).

### 3.3 Tablas Administrativas y de Configuración
* **`Usuarios`**: Almacena cuentas, contraseñas encriptadas (BCrypt/Identity hashes) y roles de acceso.
* **`WebTexts`**: Tabla clave-valor que alimenta el CMS dinámico de textos del sitio público.
* **`Notificaciones`**: Buzón de alertas internas para usuarios administradores y externos en el sistema.
