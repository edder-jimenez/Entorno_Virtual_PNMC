# MANUAL MAESTRO DE LA PLATAFORMA PNMC
## Manual de Handoff Técnico, Modelo Misional y Arquitectura de Gobernanza

Bienvenido al Manual Maestro de la plataforma del Plan Nacional de Música para la Convivencia (PNMC). Este documento sirve como la guía de referencia principal y punto de entrada unificado para desarrolladores, ingenieros, investigadores y administradores de la plataforma.

---

## 1. MISIÓN Y CONTEXTO INSTITUCIONAL DEL PNMC

El Plan Nacional de Música para la Convivencia (PNMC) es la política pública del Ministerio de las Culturas, las Artes y los Saberes de Colombia que fomenta la práctica musical como motor de vida, paz y justicia social. Su propósito es cartografiar y fortalecer el ecosistema musical del país, georreferenciando escuelas de música, festivales anuales, lutieres independientes y centros de investigación.

La plataforma digital PNMC tiene como objetivo:
1. Visibilizar: Exponer públicamente a toda la ciudadanía la riqueza musical de las regiones en un mapa interactivo (geovisor).
2. Co-gestionar: Permitir a entidades territoriales y académicas (Aliados) co-administrar de forma descentralizada la información de su red musical.
3. Participar: Ofrecer una consola abierta para que los gestores comunitarios y ciudadanos (Colaboradores) registren, actualicen y reclamen sus propios procesos culturales históricos.

---

## 2. ESTRUCTURA Y CATÁLOGO DE LA DOCUMENTACIÓN TÉCNICA

Para garantizar la mantenibilidad a largo plazo del código fuente y una fácil incorporación de nuevos equipos de ingeniería, la documentación se encuentra segmentada en sub-documentos especializados por dominios utilizando rutas portables y relativas:

### 2.1 Capa Técnica y Configuración (docs/tecnico/)
* **[Guía de Instalación y Arranque Local](./tecnico/guia_instalacion.md)**: Requisitos previos, variables de entorno, comandos de montaje/desmontaje, scripts automáticos de macOS y listado de credenciales sembradas para desarrollo.
* **[Arquitectura y Estructura de Software](./tecnico/arquitectura_y_estructura.md)**: Estructura de archivos del frontend (React 19), backend (.NET 10 Minimal APIs) y esquema de base de datos relacional (SQL Server).
* **[Auditoría Técnica y Notificaciones](./tecnico/auditoria_y_notificaciones.md)**: Trazabilidad inmutable de cambios en `RegistrosRevisionHistorial`, interceptores automáticos de EF Core y el buzón interno de notificaciones.

### 2.2 Capa Funcional y Módulos de la Web (docs/funcional/)
* **[Capa Geográfica y Mapa Ecosistémico](./funcional/mapa_ecosistemico.md)**: Integración con Leaflet, capas de marcadores con agrupamiento (clusters), mapa de calor, mapas de coropletas departamentales y sincronización DIVIPOLA.
* **[Portal Público y CMS de Textos Dinámicos](./funcional/portal_publico_y_cms.md)**: El CMS centralizado basado en la tabla `WebTexts`, carrusel de estrategias territoriales, buscador editorial de partituras y filtros de eventos.

### 2.3 Capa de Gobernanza, Roles y Reclamación (docs/gobernanza/)
* **[Manual de Roles y Permisos (RBAC)](./gobernanza/manual_roles.md)**: Homologación de roles de base de datos vs. UI, matriz completa de permisos para Webmaster, Gestor Interno, Aliado Administrador (Líder), Aliado Editor, Aliado Lector y Colaborador Externo.
* **[Convenios Institucionales y Privilegios (Habeas Data)](./gobernanza/convenios_y_privilegios.md)**: Base legal (Ley 1581 de 2012 de Colombia), enmascaramiento de datos personales en consultas públicas y flujo JWT para el acceso privilegiado de aliados.
* **[Motor de Reclamaciones de Registros Huérfanos](./gobernanza/motor_reclamaciones.md)**: Definición de Registros Huérfanos, flujo paso a paso del escaneo territorial (DIVIPOLA) de 3 segundos, bandeja de coincidencias, modal de detalles históricos y clonación editorial en Borrador (`borrador`).

### 2.4 Deudas Técnicas y Backlog de Ingeniería (docs/backlog/)
* **[Control de Deuda Técnica y Refactorizaciones](./backlog/deuda_tecnica.md)**: Desacoplamiento modular de `AdminShellPage.jsx` (archivo de 7,800 líneas), división de consolas y proveedores reales SMTP/WhatsApp.
* **[Seguridad y Blindaje de Infraestructura (Hardening)](./backlog/seguridad_y_hardening.md)**: Vulnerabilidades de dependencias `xlsx`, blindaje de endpoints de Habeas Data, prevención de RCE en cargas de archivos, CSP headers y rate limits.
* **[Compatibilidad y Accesibilidad Web (WCAG 2.1 AA)](./backlog/accesibilidad_wcag.md)**: Auditorías con axe/Lighthouse, ajustes de contrastes oscuros, atributos `alt` descriptivos, trampas de foco en modales y accesibilidad de teclado en mapas Leaflet.

---

## 3. SCRIPTS DE MONTAJE Y DESMONTAJE DEL ENTORNO LOCAL

La raíz del monorepo contiene dos comandos macOS interactivos (`.command`) diseñados para simplificar las tareas de arranque y apagado del sistema de manera 100% automatizada.

### 3.1 Montaje Rápido (`Iniciar PNMC.command`)
Para arrancar todo el ecosistema de desarrollo:
1. Otorgue permisos de ejecución si es primera vez:
   ```bash
   chmod +x Iniciar\ PNMC.command Detener\ PNMC.command
   ```
2. Ejecute el comando integrado:
   ```bash
   ./Iniciar\ PNMC.command
   ```
* **Operación Interna**: El script verifica e inicia Docker Desktop si está cerrado, levanta la base de datos SQL Server local en Docker (puerto `14333`), ejecuta la siembra inicial de base de datos local (`./scripts/seed-local-db.sh`), y abre dos ventanas de terminal macOS para correr el backend en .NET (`localhost:8080`) y el servidor Vite en React (`127.0.0.1:5173`) de manera paralela.

### 3.2 Desmontaje Rápido (`Detener PNMC.command`)
Para apagar por completo los servidores locales:
1. Ejecute el comando integrado:
   ```bash
   ./Detener\ PNMC.command
   ```
* **Operación Interna**: El script identifica y finaliza de manera limpia los procesos de sistema que están escuchando y bloqueando los puertos `5173` (Vite) y `8080` (.NET Core). A continuación, apaga de forma segura el contenedor Docker de base de datos mediante `docker compose stop` sin eliminar los datos persistidos en desarrollo.

---

## 4. HISTORIAL DE ACTUALIZACIONES DEL MANUAL MAESTRO

Este manual maestro es un documento vivo. Las modificaciones de arquitectura en el código fuente del monorepo deben quedar reflejadas en su respectivo sub-documento y ser resumidas en esta bitácora histórica:

| Fecha | Cambio Documentado | Módulos Afectados | Descripción y Observaciones |
| --- | --- | --- | --- |
| **27/05/2026** | **Eliminación de Iconografía y Emojis** | General | **Endurecimiento estético y madurez visual**. Se eliminaron todos los emojis e íconos decorativos de la documentación para dotar de una presentación sobria, técnica e institucional. |
| **27/05/2026** | **Rutas Portables y Scripts de Montaje** | General | **Mitigación de dependencias absolutas**. Se reemplazaron todas las rutas `file:///Users/edderjimenez/...` por rutas relativas portables para permitir que la documentación opere en cualquier máquina al clonar. Se redactó la Sección 3 para formalizar el uso de los scripts de montaje (`Iniciar PNMC.command`) y desmontaje (`Detener PNMC.command`). |
| **27/05/2026** | **Reestructuración y Modularización Completa** | General | **Cambio de arquitectura documental**. Se eliminaron 15 archivos sueltos y desorganizados del directorio raíz `docs/` y se reclasificaron en 4 subdirectorios lógicos (`tecnico/`, `funcional/`, `gobernanza/`, `backlog/`). Se redactó este **Manual Maestro** interactivo con enlaces relativos a cada sub-documento. |
| **27/05/2026** | **Motor de Reclamaciones e Inducción de Onboarding** | Onboarding / Colaborador | Registro detallado del flujo de escaneo territorial DIVIPOLA, bandeja de reclamación histórica, asistente contextual de perfiles y botón global de tutorial. |
| **27/05/2026** | **Backlog de Ciberseguridad y Políticas de Habeas Data** | Seguridad / Accesibilidad | Inclusión de planes de mitigación de dependencias obsoletas, rate limiting, protocolos de subida de archivos y matriz de gobernanza y enmascaramiento de Habeas Data. |
