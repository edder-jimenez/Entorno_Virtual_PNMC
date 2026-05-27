# AUDITORÍA TÉCNICA Y SISTEMA DE NOTIFICACIONES

Este sub-documento detalla las especificaciones de seguridad e ingeniería implementadas para garantizar la trazabilidad de los datos y la entrega de alertas internas dentro de la plataforma **PNMC**.

---

## 1. SISTEMA DE AUDITORÍA INMUTABLE (`RegistrosRevisionHistorial`)

Para cumplir con las normas gubernamentales de auditoría y evitar la manipulación de datos históricos, la plataforma implementa una bitácora inmutable en la tabla `RegistrosRevisionHistorial`.

### 1.1 Modelo Físico de Auditoría
Cada vez que un registro ecosistémico (Escuela de Música, Festival, Luthier o Red) sufre un cambio en su **Estado Editorial** (borrador -> revisión -> ajustes -> aprobado -> publicado) o en su **Estado de Vinculación**, el sistema gatilla automáticamente una inserción física en esta tabla.

El esquema de la tabla almacena los siguientes metadatos:

| Campo SQL | Tipo de Dato | Propósito |
| --- | --- | --- |
| `Id` | `UNIQUEIDENTIFIER` (PK) | Identificador único del log de auditoría. |
| `RegistroId` | `UNIQUEIDENTIFIER` (FK) | ID de la entidad ecosistémica afectada. |
| `UsuarioId` | `UNIQUEIDENTIFIER` (FK) | ID del usuario (Webmaster, Gestor o Colaborador) que disparó el cambio. |
| `Accion` | `NVARCHAR(50)` | Nombre de la acción ejecutada (ej. `SOLICITAR_AJUSTES`, `APROBAR_RECLAMO`). |
| `EstadoAnterior` | `NVARCHAR(30)` | Estado editorial del registro antes del cambio. |
| `EstadoNuevo` | `NVARCHAR(30)` | Estado editorial resultante tras la transacción. |
| `Observacion` | `NVARCHAR(MAX)` | Comentarios de retroalimentación textual ingresados por el moderador. |
| `FechaCreacion` | `DATETIME2` | Sello de tiempo preciso e inmutable de la operación (UTC). |

---

## 2. INTERCEPTOR DE EF CORE Y PROTECCIÓN DE DATOS

El guardado de estos logs se realiza de manera centralizada en el `DbContext` del backend utilizando interceptores de Entity Framework Core o a nivel transaccional en los controladores de la Minimal API.

### 2.1 Garantías de Seguridad en la Auditoría:
1. **No Modificación (Append-Only)**: El endpoint administrativo de auditoría no expone verbos `PUT`, `PATCH` ni `DELETE` sobre la tabla `RegistrosRevisionHistorial`. La base de datos restringe permisos de escritura directos para que solo inserciones acumulativas sean permitidas.
2. **Historial Completo**: El frontend de `/admin` dibuja en vivo la línea de tiempo del registro leyendo este historial, lo que le permite al Gestor Interno auditar quién cometió errores en cargas pasadas.

---

## 3. ARQUITECTURA DEL SISTEMA DE NOTIFICACIONES

El PNMC cuenta con una cola de mensajería asíncrona interna persistida en la tabla `Notificaciones` para mantener informados a los usuarios del flujo editorial sin depender de la carga del servidor.

### 3.1 Tipos de Notificaciones Activas en la Plataforma

1. **Notificación de Registro en Revisión**:
   * *Disparador*: Un colaborador externo o aliado envía un registro.
   * *Destinatarios*: Todos los usuarios con el rol `gestor_interno`.
   * *Propósito*: Informar que hay un nuevo registro en la cola para moderar.
2. **Notificación de Ajustes Solicitados**:
   * *Disparador*: El Gestor Ministerial rechaza un campo y escribe retroalimentación.
   * *Destinatarios*: El usuario colaborador (`externo`) dueño del registro.
   * *Propósito*: Notificarle que debe ingresar a corregir datos específicos para poder publicar su proceso.
3. **Notificación de Reclamación Exitosa**:
   * *Disparador*: El Gestor Ministerial aprueba una reclamación de registro huérfano.
   * *Destinatarios*: El Colaborador reclamante y el Aliado Coordinador regional.
   * *Propósito*: Confirmar que la vinculación se ha concretado exitosamente.

### 3.2 Canalización y Visualización de Alertas
* **Buzón en Base de Datos**: Las notificaciones se persisten en la tabla `Notificaciones` con campos de `Leido (boolean)`, `FechaLectura` y `TipoAlerta`.
* **Notificaciones en Caliente**: En el frontend, el panel del usuario consulta asíncronamente el endpoint `/api/notificaciones` al arrancar el shell administrativo. Si existen notificaciones en estado `No Leido`, despliega un badge rojo interactivo en la barra superior.
* **Proyección SMTP (Proveedor Externo)**: La arquitectura está diseñada para acoplarse con proveedores de correo transaccional (como SendGrid, Mailchimp o Amazon SES) en el backend, disparando un correo electrónico en segundo plano cada vez que se agregue un registro a la cola física de notificaciones.
