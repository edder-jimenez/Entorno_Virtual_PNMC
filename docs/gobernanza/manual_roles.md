# MANUAL DE ROLES, PERMISOS Y GOBERNANZA DE ACCESO

Este sub-documento de gobernanza detalla el **Modelo de Control de Acceso basado en Roles (RBAC)** de la plataforma del **Plan Nacional de Música para la Convivencia (PNMC)**. Define con rigor técnico qué acciones, vistas y datos administra cada perfil.

---

## 1. HOMOLOGACIÓN DE ROLES (BASE DE DATOS VS. INTERFAZ)

Para evitar discrepancias entre los modelos lógicos de base de datos y la nomenclatura de interfaces de usuario, la equivalencia exacta de roles es la siguiente:

| Rol Técnico (DB) | Rol Funcional (UI) | Consola de Acceso | Foco Operativo |
| --- | --- | --- | --- |
| `webmaster` | Webmaster | `/admin` | Administración total, CMS global, logs y base de datos |
| `gestor_interno` | Gestor Interno | `/admin` | Curaduría del Ministerio, control de duplicados y moderación |
| `aliado_admin` | Aliado Administrador (Líder) | `/colaboradores` | Coordinación de entidades asociadas por convenios |
| `aliado_editor` | Aliado Editor | `/colaboradores` | Operador regional de carga y edición institucional |
| `aliado_lector` | Aliado Lector | `/colaboradores` | Auditor de solo lectura de la red aliada |
| `externo` | Colaborador (Gestor UI) | `/colaboradores` | Gestores autónomos y ciudadanos de base territorial |
| *No registrado* | Público / Ciudadano | Portal Público | Consulta interactiva y auto-registro básico |

---

## 2. RESPONSABILIDADES Y MODELO DE OPERACIÓN POR ROL

### A. Webmaster (`webmaster`) - Administración Total
* **Propósito**: Garantizar la integridad operativa de la plataforma, la coherencia de los textos estáticos y la provisión segura de cuentas de usuario de alto nivel.
* **Acciones Permitidas**:
  * **CMS de Textos Dinámicos (`WebTexts`)**: Edita copies del Home, barra de navegación, el pie de página institucional, etc. Cuenta con interfaz de previsualización en vivo (HiFi).
  * **Administración de Usuarios**: Invita, suspende o revoca perfiles con rol `webmaster` y `gestor_interno`.
  * **Auditoría Técnica y Logs**: Supervisa la bitácora `RegistrosRevisionHistorial` y gestiona importaciones masivas de datos maestros en formatos XLSX/CSV.
* **Restricciones**: Por buenas prácticas, no debe intervenir directamente en la moderación editorial a menos que sea un caso de soporte de base de datos.

### B. Gestor Interno (`gestor_interno`) - Moderación y Calidad Editorial Ministerial
* **Propósito**: Actuar como el filtro de calidad del Ministerio de las Culturas, las Artes y los Saberes para validar que la información registrada sea real, coherente y verídica.
* **Acciones Permitidas**:
  * **Cola de Revisión**: Aprueba o rechaza registros en estado `en_revision`.
  * **Modal de Evaluación (`RecordReviewModal`)**: Utiliza vista a doble pantalla para inspeccionar campos a la izquierda y a la derecha marcar campos erróneos inyectando comentarios específicos (pasa el registro a `ajustes_solicitados`).
  * **Control de Calidad**: Evalúa duplicados y gestiona alarmas en `CalidadDatosFlags`.
* **Restricciones**: No puede modificar textos del CMS (`WebTexts`), alterar configuraciones de base de datos ni invitar a otros usuarios administrativos globales.

### C. Aliado Administrador (`aliado_admin` / Líder) - Coordinador de Convenios Regionales
* **Propósito**: Representar institucionalmente a una entidad externa firmante de convenios de cooperación con el Ministerio (por ejemplo, Secretarías de Cultura Departamentales, Universidades Públicas, o Redes de Escuelas de Música).
* **Acciones Permitidas**:
  * **Dashboard de Componente (`LiderDashboard`)**: Accede a KPIs consolidados de la red (estudiantes, lutieres, festivales por municipios).
  * **Gestión de su Red**: Invita y activa cuentas operativas de su misma entidad bajo los roles de `aliado_editor` y `aliado_lector`.
  * **Acceso Privilegiado (Habeas Data Covenants)**: Puede visualizar datos de contacto crudos dentro de su red aliada para acompañamiento regional.
  * **Exportación**: Descarga bases de datos enriquecidas en formatos XLSX/CSV con todas las fichas de su red.
* **Restricciones**: Su radio de acción se circunscribe estrictamente al identificador `EntidadAliadaId`. No puede ver registros de otras entidades aliadas.

### D. Aliado Editor (`aliado_editor`) - Operador de Carga Institucional
* **Propósito**: Ejecutar el ingreso y actualización de registros de la entidad aliada en territorio.
* **Acciones Permitidas**:
  * **Creación y Edición**: Registra festivales, escuelas o lutieres. Puede guardarlos en estado `borrador` y enviarlos a la cola de revisión ministerial.
  * **Acceso Privilegiado**: Comparte la visualización de datos de contacto confidenciales de su red aliada.
* **Restricciones**: No tiene acceso a métricas globales de la entidad aliada ni a la administración de usuarios del componente.

### E. Aliado Lector (`aliado_lector`) - Auditor de Red Aliada
* **Propósito**: Proveer visibilidad y auditoría a consultores de investigación del aliado institucional.
* **Acciones Permitidas**:
  * **Consulta Enriquecida**: Explora fichas completas, geovisores regionales y datos de contacto de su red.
* **Restricciones**: Rol estrictamente de solo lectura. No puede crear, modificar ni enviar registros a revisión.

### F. Colaborador Externo (`externo` / Gestor) - Participación Ciudadana y Comunitaria
* **Propósito**: Permitir que los actores del territorio (directores de escuelas autónomas, lutieres, colectivos, etc.) registren y mantengan actualizada su información.
* **Acciones Permitidas**:
  * **Wizard de Caracterización**: Completa la caracterización básica en 3 pasos.
  * **Sistema de Reclamación**: Reclama la propiedad de registros históricos "huérfanos" que el sistema le sugiere basados en su municipio de residencia.
  * **Edición de Propios Registros**: Gestiona su panel de "Mis Procesos Culturales", edita borradores y corrige campos en base a observaciones ministeriales.
* **Restricciones**: Su visibilidad de datos de contacto de terceros está estrictamente restringida (ver enmascaramiento). Solo visualiza datos personales de sus propios registros.

---

## 3. MATRIZ DE PERMISOS DE GOBERNANZA

| Acción / Módulo | Público | Colaborador (`externo`) | Aliado Lector | Aliado Editor | Gestor Interno | Webmaster |
| --- | --- | --- | --- | --- | --- | --- |
| Consultar geovisor y buscar eventos | Sí | Sí | Sí | Sí | Sí | Sí |
| Registrarse y activar cuenta básica | Sí | Sí | No | No | No | No |
| Enviar ficha de caracterización organizacional | No | Sí | No | No | No | No |
| Reclamar / vincular registro histórico regional | No | Sí | No | No | No | No |
| Crear y editar sus propios borradores | No | Sí | No | Sí (de su entidad) | Sí | Sí |
| **Visualizar datos de contacto protegidos (Habeas Data)** | No | No | **Sí (de su red)** | **Sí (de su red)** | **Sí** | **Sí** |
| Aprobar/Rechazar solicitudes de la red | No | No | No | No | Sí | Sí |
| Evaluar duplicados y flags de calidad | No | No | No | No | Sí | Sí |
| Administrar textos editables web (CMS) | No | No | No | No | No | Sí |
| Administrar usuarios globales y seguridad | No | No | No | No | No | Sí |
