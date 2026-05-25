# Contenidos y modulos

Este bloque contiene las tablas fuente donde vive el contenido real del sistema. Reutiliza las bases creadas previamente: `Categorias`, `EstadosContenido`, `Usuarios` y `Divipola`.

## Agenda

Guarda eventos, convocatorias, encuentros, actividades de formacion y circulacion.

Relaciones:

- `IdCategoria` -> `Categorias`
- `IdEstadoContenido` -> `EstadosContenido`
- usuarios creador/revisor/aprobador -> `Usuarios`
- territorio municipal -> `Divipola`
- `IdFestival` -> `Festivales`, cuando el evento pertenece a un festival.

Reglas:

- `FechaFin` no puede ser anterior a `FechaInicio`.
- `HoraFin` no puede ser anterior a `HoraInicio` cuando ambas existen.
- `NivelCobertura` controla si se exige departamento y municipio.

## Noticias

Guarda articulos y contenidos informativos.

Reglas:

- `Slug` es unico.
- Se relaciona con categoria, estado y usuarios de flujo editorial.
- Queda preparada para archivos y etiquetas mediante relaciones futuras.

## AlbumesGaleria

Guarda albumes o colecciones de galeria.

Reglas:

- `OrdenVisualizacion` es obligatorio y mayor que cero.
- Se relaciona con categoria, estado y usuarios de flujo editorial.

## Festivales

Tabla fuente para festivales musicales o sonoros.

Incluye:

- Identificacion y descripcion.
- Datos de organizador.
- Contacto y redes del festival.
- Informacion de version vigente.
- Territorio por `Divipola`.
- `Activo` y `EstadoRegistro`.

## EscuelasMusica

Tabla fuente para escuelas, procesos o espacios de formacion musical.

Incluye:

- Identificacion, categoria y tipo.
- Entidad responsable y direccion.
- Contacto y enlaces.
- Territorio y coordenadas.
- Capacidad formativa, estudiantes y grupos activos.
- Practicas, procesos formativos y observaciones.
- `EscuelaActiva`, `Activo` y `EstadoRegistro`.

## MercadosMusicales

Tabla fuente para mercados, ruedas, encuentros profesionales y plataformas de intercambio musical.

Incluye:

- Identificacion, periodicidad y numero de ediciones.
- Edicion vigente del ano actual.
- Entidad responsable.
- Festival asociado opcional.
- Alcance, modalidad y territorio.
- `Activo` y `EstadoRegistro`.

## RedesDocumentacion

Tabla fuente para redes, archivos, centros o procesos de documentacion musical y sonora.

Incluye:

- Nombre, tipo de centro, zona y descripcion.
- Territorio y coordenadas.
- Contacto, sitio web y redes.
- `Activo` y `EstadoRegistro`.

## Lutieres

Tabla fuente para lutieres individuales, talleres o colectivos de luteria.

Incluye:

- Tipo de lutier: `individual`, `taller` o `colectivo`.
- Nombre de taller cuando aplique.
- Especialidad, instrumentos y descripcion.
- Contacto, enlaces, territorio y coordenadas.
- `Activo` y `EstadoRegistro`.
