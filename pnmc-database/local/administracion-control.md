# Administracion y control

Este bloque sostiene la operacion interna del sistema: usuarios, roles, estados de contenido, categorias reutilizables, etiquetas, archivos y auditoria.

## Roles

Define perfiles basicos de acceso.

Valores iniciales:

- `webmaster`: control tecnico general.
- `editor`: gestion editorial de contenidos.
- `gestor`: carga y actualizacion de informacion operativa.

Reglas:

- `IdRol` es llave primaria.
- `NombreRol` es unico.

## Usuarios

Guarda las cuentas que podran autenticarse y operar el sistema.

Campos principales:

- `NombreCompleto`
- `CorreoElectronico`
- `HashContrasena`
- `IdRol`
- `Activo`
- `FechaCreacion`
- `FechaActualizacion`
- `UltimoAcceso`

Reglas:

- Cada usuario pertenece a un rol.
- `CorreoElectronico` es unico.
- La contrasena se guarda como hash, nunca como texto plano.
- Se crea un usuario tecnico inicial: `sistema@pnmc.local`.

## EstadosContenido

Catalogo de estados para contenidos administrables.

Valores iniciales:

- `borrador`
- `en_revision`
- `aprobado`
- `publicado`
- `archivado`
- `rechazado`

Reglas:

- `CodigoEstado` es unico, en minusculas y sin espacios.
- `NombreEstado` es unico.

## Categorias

Catalogo centralizado de categorias por modulo. Evita crear tablas de categorias separadas para agenda, noticias, galeria o editorial.

Campos principales:

- `CodigoModulo`
- `NombreCategoria`
- `Slug`
- `Descripcion`
- `OrdenVisualizacion`

Reglas:

- La combinacion `CodigoModulo` + `Slug` es unica.
- La combinacion `CodigoModulo` + `NombreCategoria` es unica.
- `OrdenVisualizacion` debe ser mayor que cero.

## Etiquetas

Catalogo general de etiquetas reutilizables por distintos modulos.

Reglas:

- `NombreEtiqueta` es unico.
- `Slug` es unico.

## Archivos

Gestiona metadatos de archivos y medios. No guarda binarios en base de datos.

Campos principales:

- `NombreOriginal`
- `NombreAlmacenado`
- `Extension`
- `TipoMime`
- `PesoBytes`
- `RutaAlmacenamiento`
- `UrlPublica`
- `TextoAlternativo`
- `Pie`
- `Credito`
- `IdUsuarioCarga`
- `FechaCarga`

Reglas:

- Cada archivo referencia al usuario que lo cargo.
- `RutaAlmacenamiento` es unica.
- `PesoBytes` debe ser nulo o mayor/igual a cero.

## BitacoraAuditoria

Registra acciones importantes del sistema sobre contenidos, archivos, usuarios o configuracion.

Campos principales:

- `IdUsuario`
- `TablaAfectada`
- `IdRegistroAfectado`
- `Accion`
- `ValoresAnteriores`
- `ValoresNuevos`
- `FechaAccion`

Reglas:

- `ValoresAnteriores` y `ValoresNuevos` deben ser JSON valido cuando tienen contenido.
- `IdUsuario` puede ser nulo para eventos automaticos o integraciones.
- `Accion` se restringe a acciones conocidas: crear, actualizar, eliminar, publicar, archivar, aprobar, rechazar, iniciar_sesion y cerrar_sesion.
