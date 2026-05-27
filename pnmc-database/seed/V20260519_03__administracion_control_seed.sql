/*
    PNMC - Datos iniciales minimos para administracion y control.
*/

MERGE dbo.Roles AS destino
USING (VALUES
    (N'webmaster', N'Control total de usuarios, modulos, datos, configuracion, revision, publicacion y mantenimiento.'),
    (N'gestor_interno', N'Segundo nivel general de administracion institucional.'),
    (N'aliado_admin', N'Administrador de una entidad aliada aprobada.'),
    (N'aliado_editor', N'Usuario operativo de una entidad aliada aprobada.'),
    (N'aliado_lector', N'Usuario de consulta de una entidad aliada aprobada.'),
    (N'externo', N'Participante publico sin acceso administrativo privilegiado.')
) AS origen (NombreRol, DescripcionRol)
ON destino.NombreRol = origen.NombreRol
WHEN MATCHED THEN
    UPDATE SET DescripcionRol = origen.DescripcionRol
WHEN NOT MATCHED THEN
    INSERT (NombreRol, DescripcionRol)
    VALUES (origen.NombreRol, origen.DescripcionRol);

MERGE dbo.EstadosContenido AS destino
USING (VALUES
    (N'borrador', N'Borrador', N'Contenido en elaboracion interna.'),
    (N'en_revision', N'En revision', N'Contenido enviado a revision editorial o tecnica.'),
    (N'ajustes_solicitados', N'Ajustes solicitados', N'Contenido devuelto al responsable para corregir campos u observaciones.'),
    (N'aprobado', N'Aprobado', N'Contenido aprobado, pendiente de publicacion o activacion.'),
    (N'publicado', N'Publicado', N'Contenido visible para usuarios finales.'),
    (N'archivado', N'Archivado', N'Contenido retirado de la vista publica sin eliminarlo.'),
    (N'rechazado', N'Rechazado', N'Contenido revisado y no aprobado para publicacion.')
) AS origen (CodigoEstado, NombreEstado, DescripcionEstado)
ON destino.CodigoEstado = origen.CodigoEstado
WHEN MATCHED THEN
    UPDATE SET
        NombreEstado = origen.NombreEstado,
        DescripcionEstado = origen.DescripcionEstado
WHEN NOT MATCHED THEN
    INSERT (CodigoEstado, NombreEstado, DescripcionEstado)
    VALUES (origen.CodigoEstado, origen.NombreEstado, origen.DescripcionEstado);

MERGE dbo.Categorias AS destino
USING (VALUES
    (N'agenda', N'Convocatoria', N'convocatoria', N'Eventos o llamados abiertos a participacion.', 1),
    (N'agenda', N'Encuentro', N'encuentro', N'Espacios de reunion, articulacion o intercambio.', 2),
    (N'agenda', N'Formacion', N'formacion', N'Actividades pedagogicas, talleres o procesos formativos.', 3),
    (N'agenda', N'Circulacion', N'circulacion', N'Actividades de circulacion, muestras, conciertos o programacion.', 4),
    (N'noticias', N'Institucional', N'institucional', N'Noticias y comunicaciones institucionales.', 1),
    (N'noticias', N'Territorio', N'territorio', N'Noticias relacionadas con procesos territoriales.', 2),
    (N'noticias', N'Convocatorias', N'convocatorias', N'Noticias asociadas a convocatorias o invitaciones publicas.', 3),
    (N'noticias', N'Memoria', N'memoria', N'Noticias relacionadas con memoria, documentacion e investigacion.', 4),
    (N'galeria', N'Archivo fotografico', N'archivo-fotografico', N'Albumes o registros fotograficos.', 1),
    (N'galeria', N'Video', N'video', N'Albumes o registros audiovisuales.', 2),
    (N'galeria', N'Evento', N'evento', N'Galerias asociadas a eventos especificos.', 3),
    (N'editorial', N'Publicacion', N'publicacion', N'Recursos editoriales publicados por el PNMC o aliados.', 1),
    (N'editorial', N'Investigacion', N'investigacion', N'Recursos asociados a investigacion, memoria o documentacion.', 2),
    (N'editorial', N'Material pedagogico', N'material-pedagogico', N'Recursos pedagogicos, guias, cartillas o metodologias.', 3)
) AS origen (CodigoModulo, NombreCategoria, Slug, Descripcion, OrdenVisualizacion)
ON destino.CodigoModulo = origen.CodigoModulo AND destino.Slug = origen.Slug
WHEN MATCHED THEN
    UPDATE SET
        NombreCategoria = origen.NombreCategoria,
        Descripcion = origen.Descripcion,
        OrdenVisualizacion = origen.OrdenVisualizacion
WHEN NOT MATCHED THEN
    INSERT (CodigoModulo, NombreCategoria, Slug, Descripcion, OrdenVisualizacion)
    VALUES (origen.CodigoModulo, origen.NombreCategoria, origen.Slug, origen.Descripcion, origen.OrdenVisualizacion);

MERGE dbo.Etiquetas AS destino
USING (VALUES
    (N'PNMC', N'pnmc'),
    (N'Formacion', N'formacion'),
    (N'Circulacion', N'circulacion'),
    (N'Memoria', N'memoria'),
    (N'Territorio', N'territorio'),
    (N'Participacion', N'participacion')
) AS origen (NombreEtiqueta, Slug)
ON destino.Slug = origen.Slug
WHEN MATCHED THEN
    UPDATE SET NombreEtiqueta = origen.NombreEtiqueta
WHEN NOT MATCHED THEN
    INSERT (NombreEtiqueta, Slug)
    VALUES (origen.NombreEtiqueta, origen.Slug);

DECLARE @IdRolWebmaster int = (
    SELECT IdRol FROM dbo.Roles WHERE NombreRol = N'webmaster'
);

MERGE dbo.Usuarios AS destino
USING (VALUES
    (N'Sistema PNMC', N'sistema@pnmc.local', N'pendiente_configurar_hash_seguro', @IdRolWebmaster, CAST(1 AS bit))
) AS origen (NombreCompleto, CorreoElectronico, HashContrasena, IdRol, Activo)
ON destino.CorreoElectronico = origen.CorreoElectronico
WHEN MATCHED THEN
    UPDATE SET
        NombreCompleto = origen.NombreCompleto,
        IdRol = origen.IdRol,
        Activo = origen.Activo,
        FechaActualizacion = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (NombreCompleto, CorreoElectronico, HashContrasena, IdRol, Activo)
    VALUES (origen.NombreCompleto, origen.CorreoElectronico, origen.HashContrasena, origen.IdRol, origen.Activo);

DECLARE @IdUsuarioSistema int = (
    SELECT IdUsuario FROM dbo.Usuarios WHERE CorreoElectronico = N'sistema@pnmc.local'
);

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Archivos
    WHERE RutaAlmacenamiento = N'local/pendiente/placeholder.txt'
)
BEGIN
    INSERT INTO dbo.Archivos
        (NombreOriginal, NombreAlmacenado, Extension, TipoMime, PesoBytes, RutaAlmacenamiento, UrlPublica, TextoAlternativo, Pie, Credito, IdUsuarioCarga)
    VALUES
        (N'placeholder.txt', N'placeholder.txt', N'.txt', N'text/plain', 0, N'local/pendiente/placeholder.txt', NULL, N'Archivo temporal de prueba', N'Registro inicial para validar metadatos de archivos.', N'PNMC', @IdUsuarioSistema);
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.BitacoraAuditoria
    WHERE TablaAfectada = N'AdministracionControl'
      AND IdRegistroAfectado = N'seed-inicial'
      AND Accion = N'crear'
)
BEGIN
    INSERT INTO dbo.BitacoraAuditoria
        (IdUsuario, TablaAfectada, IdRegistroAfectado, Accion, ValoresAnteriores, ValoresNuevos)
    VALUES
        (@IdUsuarioSistema, N'AdministracionControl', N'seed-inicial', N'crear', NULL, N'{"mensaje":"Carga inicial de administracion y control"}');
END;
