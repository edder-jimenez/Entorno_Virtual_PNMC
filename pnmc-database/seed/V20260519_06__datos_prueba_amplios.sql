/*
    PNMC - Datos de prueba amplios e interrelacionados

    Esta semilla reinicia los datos sinteticos de contenido y articulacion
    de la base local. No toca bases maestras, usuarios, roles, estados,
    categorias, etiquetas, Divipola ni Participaciones.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DELETE FROM dbo.AlbumesGaleriaArchivos;
DELETE FROM dbo.AlbumesGaleriaEtiquetas;
DELETE FROM dbo.NoticiasArchivos;
DELETE FROM dbo.NoticiasEtiquetas;
DELETE FROM dbo.AgendaArchivos;
DELETE FROM dbo.AgendaEtiquetas;
DELETE FROM dbo.RegistrosEcosistemaPracticasMusicales;
DELETE FROM dbo.RegistrosEcosistemaTerritoriosSonoros;
DELETE FROM dbo.RegistrosEcosistema;
DELETE FROM dbo.MetricasDepartamentoMapa;
DELETE FROM dbo.MetricasMunicipioMapa;
DELETE FROM dbo.BitacoraAuditoria;
DELETE FROM dbo.Agenda;
DELETE FROM dbo.Noticias;
DELETE FROM dbo.AlbumesGaleria;
DELETE FROM dbo.MercadosMusicales;
DELETE FROM dbo.EscuelasMusica;
DELETE FROM dbo.RedesDocumentacion;
DELETE FROM dbo.Lutieres;
DELETE FROM dbo.Festivales;
DELETE FROM dbo.Archivos;

DBCC CHECKIDENT ('dbo.AlbumesGaleriaArchivos', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.AlbumesGaleriaEtiquetas', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.NoticiasArchivos', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.NoticiasEtiquetas', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.AgendaArchivos', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.AgendaEtiquetas', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.RegistrosEcosistemaPracticasMusicales', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.RegistrosEcosistemaTerritoriosSonoros', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.RegistrosEcosistema', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.BitacoraAuditoria', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.Agenda', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.Noticias', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.AlbumesGaleria', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.MercadosMusicales', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.EscuelasMusica', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.RedesDocumentacion', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.Lutieres', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.Festivales', RESEED, 0) WITH NO_INFOMSGS;
DBCC CHECKIDENT ('dbo.Archivos', RESEED, 0) WITH NO_INFOMSGS;

DECLARE @IdUsuario int = (SELECT TOP (1) IdUsuario FROM dbo.Usuarios ORDER BY IdUsuario);
DECLARE @IdEstadoPublicado int = (SELECT IdEstadoContenido FROM dbo.EstadosContenido WHERE CodigoEstado = N'publicado');
DECLARE @CodigoEstadoPublicado nvarchar(80) = N'publicado';
DECLARE @IdCategoriaAgenda int = (SELECT TOP (1) IdCategoria FROM dbo.Categorias WHERE CodigoModulo = N'agenda' ORDER BY OrdenVisualizacion);
DECLARE @IdCategoriaNoticias int = (SELECT TOP (1) IdCategoria FROM dbo.Categorias WHERE CodigoModulo = N'noticias' ORDER BY OrdenVisualizacion);
DECLARE @IdCategoriaGaleria int = (SELECT TOP (1) IdCategoria FROM dbo.Categorias WHERE CodigoModulo = N'galeria' ORDER BY OrdenVisualizacion);

IF @IdUsuario IS NULL OR @IdEstadoPublicado IS NULL
BEGIN
    THROW 52000, 'No existen usuario base o estado publicado para cargar datos de prueba.', 1;
END;

DECLARE @Municipios TABLE
(
    Fila int NOT NULL PRIMARY KEY,
    CodigoDepartamento char(2) NOT NULL,
    NombreDepartamento nvarchar(120) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    NombreMunicipio nvarchar(120) NOT NULL,
    Latitud decimal(9,6) NULL,
    Longitud decimal(9,6) NULL
);

;WITH MunicipiosBase AS
(
    SELECT
        d.CodigoDepartamento,
        d.NombreDepartamento,
        d.CodigoMunicipio,
        d.NombreMunicipio,
        d.Latitud,
        d.Longitud,
        ROW_NUMBER() OVER (PARTITION BY d.CodigoDepartamento ORDER BY d.NombreMunicipio) AS FilaDepartamento,
        CASE d.CodigoDepartamento
            WHEN '05' THEN 1
            WHEN '76' THEN 2
            WHEN '08' THEN 3
                WHEN '13' THEN 4
            WHEN '52' THEN 5
            WHEN '50' THEN 6
            ELSE 7
        END AS OrdenDepartamento
    FROM dbo.Divipola d
    WHERE d.CodigoDepartamento IN ('05', '76', '08', '13', '52', '50')
)
INSERT INTO @Municipios
    (Fila, CodigoDepartamento, NombreDepartamento, CodigoMunicipio, NombreMunicipio, Latitud, Longitud)
SELECT
    ROW_NUMBER() OVER (ORDER BY OrdenDepartamento, NombreMunicipio) AS Fila,
    CodigoDepartamento,
    NombreDepartamento,
    CodigoMunicipio,
    NombreMunicipio,
    Latitud,
    Longitud
FROM MunicipiosBase
WHERE FilaDepartamento <= 5
ORDER BY OrdenDepartamento, NombreMunicipio;

IF (SELECT COUNT(*) FROM @Municipios) < 30
BEGIN
    THROW 52001, 'No hay suficientes municipios seleccionados para generar la prueba amplia.', 1;
END;

DECLARE @Festivales TABLE (Indice int PRIMARY KEY, IdFestival int NOT NULL);
DECLARE @Escuelas TABLE (Indice int PRIMARY KEY, IdEscuelaMusica int NOT NULL);
DECLARE @Mercados TABLE (Indice int PRIMARY KEY, IdMercadoMusical int NOT NULL);
DECLARE @Redes TABLE (Indice int PRIMARY KEY, IdRedDocumentacion int NOT NULL);
DECLARE @Lutieres TABLE (Indice int PRIMARY KEY, IdLutier int NOT NULL);
DECLARE @Agenda TABLE (Indice int PRIMARY KEY, IdAgenda int NOT NULL);
DECLARE @Noticias TABLE (Indice int PRIMARY KEY, IdNoticia int NOT NULL);
DECLARE @Albumes TABLE (Indice int PRIMARY KEY, IdAlbum int NOT NULL);
DECLARE @Archivos TABLE (Indice int PRIMARY KEY, IdArchivo int NOT NULL);

DECLARE @i int = 1;

WHILE @i <= 30
BEGIN
    DECLARE @CodigoDepartamento char(2);
    DECLARE @NombreDepartamento nvarchar(120);
    DECLARE @CodigoMunicipio char(5);
    DECLARE @NombreMunicipio nvarchar(120);
    DECLARE @Latitud decimal(9,6);
    DECLARE @Longitud decimal(9,6);

    SELECT
        @CodigoDepartamento = CodigoDepartamento,
        @NombreDepartamento = NombreDepartamento,
        @CodigoMunicipio = CodigoMunicipio,
        @NombreMunicipio = NombreMunicipio,
        @Latitud = Latitud,
        @Longitud = Longitud
    FROM @Municipios
    WHERE Fila = @i;

    INSERT INTO dbo.Archivos
        (NombreOriginal, NombreAlmacenado, Extension, TipoMime, PesoBytes, RutaAlmacenamiento,
         UrlPublica, TextoAlternativo, Pie, Credito, IdUsuarioCarga, FechaCarga)
    VALUES
        (CONCAT(N'imagen-prueba-pnmc-', RIGHT(CONCAT(N'00', @i), 2), N'.jpg'),
         CONCAT(N'imagen-prueba-pnmc-', RIGHT(CONCAT(N'00', @i), 2), N'.jpg'),
         N'.jpg',
         N'image/jpeg',
         180000 + (@i * 1370),
         CONCAT(N'/media/galeria/territorios-prueba/imagen-prueba-pnmc-', RIGHT(CONCAT(N'00', @i), 2), N'.jpg'),
         CONCAT(N'https://pnmc.local/media/galeria/territorios-prueba/imagen-prueba-pnmc-', RIGHT(CONCAT(N'00', @i), 2), N'.jpg'),
         CONCAT(N'Imagen de referencia para ', @NombreMunicipio),
         CONCAT(N'Registro visual de proceso musical en ', @NombreDepartamento),
         N'Archivo de prueba PNMC',
         @IdUsuario,
         DATEADD(DAY, -@i, SYSUTCDATETIME()));

    DECLARE @IdArchivo int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Archivos VALUES (@i, @IdArchivo);

    INSERT INTO dbo.Festivales
        (NombreFestival, NumeroVersiones, FechaUltimaVersion, Descripcion, Organizador,
         CorreoOrganizador, TelefonoOrganizador, SitioWebOrganizador, CorreoFestival,
         InstagramFestival, FacebookFestival, SitioWebFestival, OtroEnlaceFestival,
         TelefonoFestival, TieneVersionVigenteAnoActual, EstadoVersionAnoActual,
         FechaInicioVersionActual, FechaFinVersionActual, NivelCobertura, CodigoDepartamento,
         CodigoMunicipio, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion)
    VALUES
        (CONCAT(N'Festival PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' - ', @NombreMunicipio),
         3 + (@i % 18),
         DATEADD(DAY, -(@i * 9), CONVERT(date, '2026-05-01')),
         CONCAT(N'Festival de prueba para validar lectura ecosistemica, programacion y territorio en ', @NombreMunicipio, N'.'),
         CONCAT(N'Corporacion Musical ', @NombreMunicipio),
         CONCAT(N'organizador', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'+57 300 000 ', RIGHT(CONCAT(N'0000', @i), 4)),
         CONCAT(N'https://organizador', RIGHT(CONCAT(N'00', @i), 2), N'.pnmc.local'),
         CONCAT(N'festival', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'https://instagram.com/festivalpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://facebook.com/festivalpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://festivalpnmc', RIGHT(CONCAT(N'00', @i), 2), N'.local'),
         CONCAT(N'https://linktr.ee/festivalpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'+57 301 100 ', RIGHT(CONCAT(N'0000', @i), 4)),
         CASE WHEN @i % 3 = 0 THEN 0 ELSE 1 END,
         CASE WHEN @i % 3 = 0 THEN N'en_preparacion' ELSE N'programada' END,
         DATEADD(DAY, @i, CONVERT(date, '2026-07-01')),
         DATEADD(DAY, @i + 3, CONVERT(date, '2026-07-01')),
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         1,
         @CodigoEstadoPublicado,
         DATEADD(DAY, -60 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME());

    DECLARE @IdFestival int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Festivales VALUES (@i, @IdFestival);

    INSERT INTO dbo.EscuelasMusica
        (NombreEscuela, CategoriaEscuela, TipoEscuela, EntidadResponsable, NombreDirector,
         CorreoContacto, TelefonoContacto, SitioWeb, Instagram, Facebook, OtroEnlace,
         NivelCobertura, CodigoDepartamento, CodigoMunicipio, LugarEspecifico, Direccion,
         Latitud, Longitud, CapacidadFormativa, CantidadEstudiantes, CantidadGruposActivos,
         ProcesosFormativos, PracticasMusicales, EscuelaActiva, Observaciones, Activo,
         EstadoRegistro, FechaCreacion, FechaActualizacion)
    VALUES
        (CONCAT(N'Escuela de Musica PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' - ', @NombreMunicipio),
         CASE WHEN @i % 2 = 0 THEN N'publica' ELSE N'comunitaria' END,
         CASE WHEN @i % 3 = 0 THEN N'casa de cultura' ELSE N'escuela municipal' END,
         CONCAT(N'Alcaldia de ', @NombreMunicipio),
         CONCAT(N'Director Musical ', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'escuela', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'+57 302 200 ', RIGHT(CONCAT(N'0000', @i), 4)),
         CONCAT(N'https://escuelapnmc', RIGHT(CONCAT(N'00', @i), 2), N'.local'),
         CONCAT(N'https://instagram.com/escuelapnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://facebook.com/escuelapnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://wa.me/57302200', RIGHT(CONCAT(N'0000', @i), 4)),
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         CONCAT(N'Casa de Cultura de ', @NombreMunicipio),
         CONCAT(N'Calle ', @i, N' # ', 10 + @i, N'-', 20 + @i),
         @Latitud,
         @Longitud,
         80 + (@i * 6),
         35 + (@i * 7),
         2 + (@i % 8),
         N'iniciacion musical; ensamble; practica coral; formacion instrumental',
         CASE WHEN @i % 2 = 0 THEN N'bandas; musicas populares; practicas comunitarias' ELSE N'cantos; percusion; musicas tradicionales' END,
         1,
         CONCAT(N'Dato de prueba concentrado en ', @NombreDepartamento, N' para validar metricas territoriales.'),
         1,
         @CodigoEstadoPublicado,
         DATEADD(DAY, -50 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME());

    DECLARE @IdEscuela int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Escuelas VALUES (@i, @IdEscuela);

    INSERT INTO dbo.MercadosMusicales
        (NombreMercado, NumeroEdiciones, Periodicidad, Descripcion, TieneEdicionVigenteAnoActual,
         EstadoEdicionAnoActual, FechaInicioEdicionActual, FechaFinEdicionActual, EntidadResponsable,
         CorreoEntidadResponsable, TelefonoEntidadResponsable, SitioWebEntidadResponsable,
         IdFestivalAsociado, NombreFestivalAsociado, Alcance, Modalidad, NivelCobertura,
         CodigoDepartamento, CodigoMunicipio, LugarEspecifico, Activo, EstadoRegistro,
         FechaCreacion, FechaActualizacion)
    VALUES
        (CONCAT(N'Mercado Musical PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' - ', @NombreMunicipio),
         1 + (@i % 12),
         CASE WHEN @i % 2 = 0 THEN N'anual' ELSE N'bienal' END,
         CONCAT(N'Mercado de prueba para circulacion, formacion de agentes y articulacion en ', @NombreMunicipio, N'.'),
         CASE WHEN @i % 4 = 0 THEN 0 ELSE 1 END,
         CASE WHEN @i % 4 = 0 THEN N'en_diseno' ELSE N'vigente' END,
         DATEADD(DAY, @i, CONVERT(date, '2026-09-01')),
         DATEADD(DAY, @i + 2, CONVERT(date, '2026-09-01')),
         CONCAT(N'Red de Circulacion ', @NombreDepartamento),
         CONCAT(N'mercado', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'+57 303 300 ', RIGHT(CONCAT(N'0000', @i), 4)),
         CONCAT(N'https://mercadopnmc', RIGHT(CONCAT(N'00', @i), 2), N'.local'),
         @IdFestival,
         CONCAT(N'Festival PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' - ', @NombreMunicipio),
         CASE WHEN @i % 2 = 0 THEN N'regional' ELSE N'nacional' END,
         CASE WHEN @i % 3 = 0 THEN N'hibrida' ELSE N'presencial' END,
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         CONCAT(N'Centro cultural de ', @NombreMunicipio),
         1,
         @CodigoEstadoPublicado,
         DATEADD(DAY, -40 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME());

    DECLARE @IdMercado int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Mercados VALUES (@i, @IdMercado);

    INSERT INTO dbo.RedesDocumentacion
        (Nombre, TipoCentro, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Zona,
         Latitud, Longitud, Descripcion, CorreoContacto, SitioWeb, Facebook, Instagram,
         OtroEnlace, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion)
    VALUES
        (CONCAT(N'Centro de Documentacion Sonora PNMC ', RIGHT(CONCAT(N'00', @i), 2)),
         CASE WHEN @i % 2 = 0 THEN N'archivo sonoro' ELSE N'centro de memoria musical' END,
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         CASE WHEN @i % 2 = 0 THEN N'urbana' ELSE N'rural' END,
         @Latitud,
         @Longitud,
         CONCAT(N'Red de documentacion de prueba para colecciones, archivos y paisajes sonoros de ', @NombreMunicipio, N'.'),
         CONCAT(N'documentacion', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'https://documentacionpnmc', RIGHT(CONCAT(N'00', @i), 2), N'.local'),
         CONCAT(N'https://facebook.com/documentacionpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://instagram.com/documentacionpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://archivo.pnmc.local/', RIGHT(CONCAT(N'00', @i), 2)),
         1,
         @CodigoEstadoPublicado,
         DATEADD(DAY, -35 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME());

    DECLARE @IdRed int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Redes VALUES (@i, @IdRed);

    INSERT INTO dbo.Lutieres
        (Nombre, TipoLutier, NombreTaller, Especialidad, Instrumentos, Descripcion,
         NombreContacto, CorreoContacto, TelefonoContacto, SitioWeb, Facebook, Instagram,
         OtroEnlace, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Direccion,
         Zona, Latitud, Longitud, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion)
    VALUES
        (CONCAT(N'Lutier PNMC ', RIGHT(CONCAT(N'00', @i), 2)),
         CASE WHEN @i % 3 = 0 THEN N'colectivo' WHEN @i % 2 = 0 THEN N'taller' ELSE N'individual' END,
         CONCAT(N'Taller Sonoro ', @NombreMunicipio),
         CASE WHEN @i % 2 = 0 THEN N'instrumentos de cuerda y reparacion' ELSE N'percusion tradicional y aerofonos' END,
         CASE WHEN @i % 2 = 0 THEN N'tiples; guitarras; bandolas' ELSE N'tambores; flautas; maracas' END,
         CONCAT(N'Registro de luteria de prueba con cobertura en ', @NombreMunicipio, N'.'),
         CONCAT(N'Contacto Lutier ', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'lutier', RIGHT(CONCAT(N'00', @i), 2), N'@pnmc.local'),
         CONCAT(N'+57 304 400 ', RIGHT(CONCAT(N'0000', @i), 4)),
         CONCAT(N'https://lutierpnmc', RIGHT(CONCAT(N'00', @i), 2), N'.local'),
         CONCAT(N'https://facebook.com/lutierpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://instagram.com/lutierpnmc', RIGHT(CONCAT(N'00', @i), 2)),
         CONCAT(N'https://catalogo.pnmc.local/lutieres/', RIGHT(CONCAT(N'00', @i), 2)),
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         CONCAT(N'Carrera ', 2 + @i, N' # ', 5 + @i, N'-', 12 + @i),
         CASE WHEN @i % 2 = 0 THEN N'urbana' ELSE N'rural' END,
         @Latitud,
         @Longitud,
         1,
         @CodigoEstadoPublicado,
         DATEADD(DAY, -30 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME());

    DECLARE @IdLutier int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Lutieres VALUES (@i, @IdLutier);

    INSERT INTO dbo.Agenda
        (Titulo, DescripcionCorta, DescripcionLarga, IdCategoria, FechaInicio, FechaFin,
         HoraInicio, HoraFin, NivelCobertura, CodigoDepartamento, CodigoMunicipio,
         LugarEspecifico, Organizador, UrlMasInformacion, IdFestival, IdEstadoContenido,
         OrdenVisualizacion, FechaCreacion, FechaActualizacion, FechaPublicacion,
         IdUsuarioCreador, IdUsuarioRevisor, IdUsuarioAprobador)
    VALUES
        (CONCAT(N'Encuentro PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' en ', @NombreMunicipio),
         CONCAT(N'Actividad de prueba asociada al festival ', RIGHT(CONCAT(N'00', @i), 2), N'.'),
         CONCAT(N'Agenda de prueba para validar calendario, territorio, categorias, archivos y etiquetas en ', @NombreDepartamento, N'.'),
         @IdCategoriaAgenda,
         DATEADD(DAY, @i, CONVERT(date, '2026-08-01')),
         DATEADD(DAY, @i + 1, CONVERT(date, '2026-08-01')),
         CONVERT(time(0), '09:00:00'),
         CONVERT(time(0), '17:00:00'),
         N'municipal',
         @CodigoDepartamento,
         @CodigoMunicipio,
         CONCAT(N'Auditorio municipal de ', @NombreMunicipio),
         CONCAT(N'Equipo PNMC ', @NombreDepartamento),
         CONCAT(N'https://agenda.pnmc.local/eventos/', RIGHT(CONCAT(N'00', @i), 2)),
         @IdFestival,
         @IdEstadoPublicado,
         @i,
         DATEADD(DAY, -25 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME(),
         DATEADD(DAY, -10 + @i, SYSUTCDATETIME()),
         @IdUsuario,
         @IdUsuario,
         @IdUsuario);

    DECLARE @IdAgenda int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Agenda VALUES (@i, @IdAgenda);

    INSERT INTO dbo.Noticias
        (Titulo, Slug, Entradilla, Cuerpo, CitaDestacada, Autor, IdCategoria,
         FechaPublicacion, UrlExterna, UrlEmbed, IdEstadoContenido, OrdenVisualizacion,
         FechaCreacion, FechaActualizacion, IdUsuarioCreador, IdUsuarioRevisor, IdUsuarioAprobador)
    VALUES
        (CONCAT(N'Noticia PNMC ', RIGHT(CONCAT(N'00', @i), 2), N': procesos musicales en ', @NombreMunicipio),
         CONCAT(N'noticia-pnmc-', RIGHT(CONCAT(N'00', @i), 2), N'-', LOWER(REPLACE(@NombreMunicipio, N' ', N'-'))),
         CONCAT(N'Entradilla de prueba sobre procesos musicales de ', @NombreDepartamento, N'.'),
         CONCAT(N'Cuerpo de noticia de prueba. Este contenido permite validar busqueda, lectura editorial y publicacion en el sistema local para ', @NombreMunicipio, N'.'),
         CONCAT(N'La practica musical fortalece la vida cultural de ', @NombreMunicipio, N'.'),
         N'Equipo editorial PNMC',
         @IdCategoriaNoticias,
         DATEADD(DAY, -@i, SYSUTCDATETIME()),
         CONCAT(N'https://noticias.pnmc.local/', RIGHT(CONCAT(N'00', @i), 2)),
         NULL,
         @IdEstadoPublicado,
         @i,
         DATEADD(DAY, -20 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME(),
         @IdUsuario,
         @IdUsuario,
         @IdUsuario);

    DECLARE @IdNoticia int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Noticias VALUES (@i, @IdNoticia);

    INSERT INTO dbo.AlbumesGaleria
        (TituloAlbum, DescripcionAlbum, IdCategoria, IdEstadoContenido, OrdenVisualizacion,
         FechaCreacion, FechaActualizacion, FechaPublicacion, IdUsuarioCreador,
         IdUsuarioRevisor, IdUsuarioAprobador)
    VALUES
        (CONCAT(N'Album PNMC ', RIGHT(CONCAT(N'00', @i), 2), N' - ', @NombreDepartamento),
         CONCAT(N'Album de prueba con registro visual de procesos musicales en ', @NombreMunicipio, N'.'),
         @IdCategoriaGaleria,
         @IdEstadoPublicado,
         @i,
         DATEADD(DAY, -15 + @i, SYSUTCDATETIME()),
         SYSUTCDATETIME(),
         DATEADD(DAY, -5 + @i, SYSUTCDATETIME()),
         @IdUsuario,
         @IdUsuario,
         @IdUsuario);

    DECLARE @IdAlbum int = CONVERT(int, SCOPE_IDENTITY());
    INSERT INTO @Albumes VALUES (@i, @IdAlbum);

    INSERT INTO dbo.BitacoraAuditoria
        (IdUsuario, TablaAfectada, IdRegistroAfectado, Accion, ValoresAnteriores, ValoresNuevos, FechaAccion)
    VALUES
        (@IdUsuario,
         CASE WHEN @i % 3 = 0 THEN N'Festivales' WHEN @i % 3 = 1 THEN N'Agenda' ELSE N'Noticias' END,
         CONVERT(nvarchar(120), @i),
         CASE WHEN @i % 2 = 0 THEN N'publicar' ELSE N'crear' END,
         NULL,
         CONCAT(N'{"registroPrueba":', @i, N',"departamento":"', @NombreDepartamento, N'"}'),
         DATEADD(DAY, -@i, SYSUTCDATETIME()));

    SET @i += 1;
END;

INSERT INTO dbo.AgendaEtiquetas (IdAgenda, IdEtiqueta)
SELECT a.IdAgenda, e.IdEtiqueta
FROM @Agenda a
CROSS APPLY (
    SELECT TOP (1) IdEtiqueta
    FROM dbo.Etiquetas
    ORDER BY CASE WHEN IdEtiqueta % 30 = a.Indice % 30 THEN 0 ELSE 1 END, IdEtiqueta
) e;

INSERT INTO dbo.NoticiasEtiquetas (IdNoticia, IdEtiqueta)
SELECT n.IdNoticia, e.IdEtiqueta
FROM @Noticias n
CROSS APPLY (
    SELECT TOP (1) IdEtiqueta
    FROM dbo.Etiquetas
    ORDER BY CASE WHEN IdEtiqueta % 30 = n.Indice % 30 THEN 0 ELSE 1 END, IdEtiqueta DESC
) e;

INSERT INTO dbo.AlbumesGaleriaEtiquetas (IdAlbum, IdEtiqueta)
SELECT a.IdAlbum, e.IdEtiqueta
FROM @Albumes a
CROSS APPLY (
    SELECT TOP (1) IdEtiqueta
    FROM dbo.Etiquetas
    ORDER BY ABS(IdEtiqueta - ((a.Indice % 6) + 1)), IdEtiqueta
) e;

INSERT INTO dbo.AgendaArchivos (IdAgenda, IdArchivo, RolArchivo, OrdenVisualizacion)
SELECT a.IdAgenda, f.IdArchivo, N'imagen_principal', a.Indice
FROM @Agenda a
INNER JOIN @Archivos f ON f.Indice = a.Indice;

INSERT INTO dbo.NoticiasArchivos (IdNoticia, IdArchivo, RolArchivo, OrdenVisualizacion)
SELECT n.IdNoticia, f.IdArchivo, N'imagen_principal', n.Indice
FROM @Noticias n
INNER JOIN @Archivos f ON f.Indice = n.Indice;

INSERT INTO dbo.AlbumesGaleriaArchivos (IdAlbum, IdArchivo, RolArchivo, OrdenVisualizacion)
SELECT a.IdAlbum, f.IdArchivo, N'foto', a.Indice
FROM @Albumes a
INNER JOIN @Archivos f ON f.Indice = a.Indice;

INSERT INTO dbo.RegistrosEcosistema
    (IdTipoRegistroEcosistema, IdRegistroOrigen, NombreRegistro, CodigoDepartamento, CodigoMunicipio, Latitud, Longitud)
SELECT t.IdTipoRegistroEcosistema, f.IdFestival, fe.NombreFestival, fe.CodigoDepartamento, fe.CodigoMunicipio, NULL, NULL
FROM @Festivales f
INNER JOIN dbo.Festivales fe ON fe.IdFestival = f.IdFestival
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = N'festival'
UNION ALL
SELECT t.IdTipoRegistroEcosistema, e.IdEscuelaMusica, em.NombreEscuela, em.CodigoDepartamento, em.CodigoMunicipio, em.Latitud, em.Longitud
FROM @Escuelas e
INNER JOIN dbo.EscuelasMusica em ON em.IdEscuelaMusica = e.IdEscuelaMusica
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = N'escuela_musica'
UNION ALL
SELECT t.IdTipoRegistroEcosistema, m.IdMercadoMusical, mm.NombreMercado, mm.CodigoDepartamento, mm.CodigoMunicipio, NULL, NULL
FROM @Mercados m
INNER JOIN dbo.MercadosMusicales mm ON mm.IdMercadoMusical = m.IdMercadoMusical
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = N'mercado_musical'
UNION ALL
SELECT t.IdTipoRegistroEcosistema, r.IdRedDocumentacion, rd.Nombre, rd.CodigoDepartamento, rd.CodigoMunicipio, rd.Latitud, rd.Longitud
FROM @Redes r
INNER JOIN dbo.RedesDocumentacion rd ON rd.IdRedDocumentacion = r.IdRedDocumentacion
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = N'red_documentacion'
UNION ALL
SELECT t.IdTipoRegistroEcosistema, l.IdLutier, lu.Nombre, lu.CodigoDepartamento, lu.CodigoMunicipio, lu.Latitud, lu.Longitud
FROM @Lutieres l
INNER JOIN dbo.Lutieres lu ON lu.IdLutier = l.IdLutier
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = N'lutier';

INSERT INTO dbo.RegistrosEcosistemaTerritoriosSonoros (IdRegistroEcosistema, IdTerritorioSonoro)
SELECT
    r.IdRegistroEcosistema,
    ts.IdTerritorioSonoro
FROM dbo.RegistrosEcosistema r
CROSS APPLY (
    SELECT TOP (1) IdTerritorioSonoro
    FROM dbo.TerritoriosSonoros
    ORDER BY ABS(IdTerritorioSonoro - ((r.IdRegistroEcosistema % 14) + 1)), IdTerritorioSonoro
) ts;

INSERT INTO dbo.RegistrosEcosistemaPracticasMusicales (IdRegistroEcosistema, IdPracticaMusical)
SELECT
    r.IdRegistroEcosistema,
    pm.IdPracticaMusical
FROM dbo.RegistrosEcosistema r
CROSS APPLY (
    SELECT TOP (1) IdPracticaMusical
    FROM dbo.PracticasMusicales
    ORDER BY ABS(IdPracticaMusical - ((r.IdRegistroEcosistema % 16) + 1)), IdPracticaMusical
) pm;

EXEC dbo.sp_ActualizarMetricasMapa;

COMMIT TRANSACTION;

SELECT N'Datos de prueba cargados' AS Resultado;
