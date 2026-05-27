-- =========================================================================
-- SCRIPT DE DATOS DE PRUEBA EXHAUSTIVOS PARA MODERACIÓN Y CONSOLA DE PNMC
-- =========================================================================

USE [PNMC_LOCAL];
GO

-- Limpiar registros de prueba anteriores para evitar duplicados en ejecuciones repetidas
DELETE FROM dbo.EntidadesHistorialRevision WHERE IdEntidad >= 100;
DELETE FROM dbo.UsuariosEntidades WHERE IdEntidad >= 100;
DELETE FROM dbo.EntidadesRegistrosFuente WHERE IdEntidad >= 100;
DELETE FROM dbo.Entidades WHERE IdEntidad >= 100;
GO

-- Habilitar inserción explícita de ID en Entidades para consistencia en pruebas
SET IDENTITY_INSERT dbo.Entidades ON;

-- -------------------------------------------------------------------------
-- 1. POBLAR TABLA: dbo.Entidades (Perfiles Administrativos)
-- -------------------------------------------------------------------------
-- Insertando entidades en todos los estados y tipos disponibles

-- ESTADO: borrador (Borradores en edición)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion)
VALUES 
(100, N'colectivo', N'Colectivo de Canto del Litoral Pacífico', N'Colectivo Canto Litoral S.A.S.', N'Grupo musical comunitario enfocado en cantos tradicionales.', N'canto.litoral@pnmc.local', N'3101112233', N'http://cantolitoral.local', N'municipal', '05', '05001', N'borrador', 1, 4, 4, SYSUTCDATETIME()),
(101, N'organizacion', N'Asociación Musical Sinfónica Opus', N'Corporación Opus Colombia', N'Asociación cultural para la promoción de música de cámara.', N'opus@pnmc.local', N'3124445566', N'http://sinfonicaopus.local', N'municipal', '05', '05001', N'borrador', 1, 5, 5, SYSUTCDATETIME()),
(102, N'lutier', N'Lutería del Sur y Cuerdas Frotadas', N'Taller Lutería Sur', N'Construcción y reparación de violines, violas y violonchelos.', N'luteria.sur@pnmc.local', N'3157778899', N'http://luteriasur.local', N'municipal', '05', '05001', N'borrador', 1, 7, 7, SYSUTCDATETIME());

-- ESTADO: en_revision (Esperando aprobación del Gestor Interno o Webmaster)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion, FechaRevision)
VALUES 
(103, N'organizacion', N'Fundación Filarmónica Metropolitana', N'Fundación Filarmónica Met.', N'Escuela filarmónica con más de 200 jóvenes activos en orquestas.', N'filarmonica.metro@pnmc.local', N'3202223344', N'http://filamero.local', N'municipal', '05', '05001', N'en_revision', 1, 4, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),
(104, N'festival', N'Festival de Tambores Ancestrales de Barú', N'Festival Tambores Barú Ltda.', N'Evento anual de rescate de ritmos afrocolombianos de percusión.', N'tambores.baru@pnmc.local', N'3113334455', N'http://tamboresbaru.local', N'municipal', '05', '05001', N'en_revision', 1, 5, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),
(105, N'escuela_musica', N'Escuela de Música Campestre Silvestre', N'Silvestre Escuela S.A.S.', N'Formatos musicales rurales y tradicionales para niños.', N'escuela.silvestre@pnmc.local', N'3184445566', N'http://silvestre.local', N'municipal', '05', '05001', N'en_revision', 1, 7, 3, SYSUTCDATETIME(), SYSUTCDATETIME());

-- ESTADO: ajustes_solicitados (Devuelto con observaciones para corregir)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion, FechaActualizacion)
VALUES 
(106, N'colectivo', N'Colectivo de Cuerdas Sol del Desierto', N'Cuerdas Desierto', N'Ensamble de cuerdas típicas y andinas colombianas.', N'sol.desierto@pnmc.local', N'3215556677', N'http://soldesierto.local', N'municipal', '05', '05001', N'ajustes_solicitados', 1, 5, 5, SYSUTCDATETIME(), SYSUTCDATETIME()),
(107, N'mercado_musical', N'Mercado de Música Electrónica de Montaña', N'Mercado ElectroMontaña', N'Plataforma comercial para compositores y productores de música electrónica.', N'electro.montana@pnmc.local', N'3176667788', N'http://electromontana.local', N'municipal', '05', '05001', N'ajustes_solicitados', 1, 4, 4, SYSUTCDATETIME(), SYSUTCDATETIME());

-- ESTADO: aprobado (Listas para publicación final)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion, FechaAprobacion)
VALUES 
(108, N'organizacion', N'Asociación Coral de Voces Unidas', N'Coral Voces Unidas', N'Coro polifónico profesional y formativo.', N'coral@pnmc.local', N'3169990011', N'http://vocesunidas.local', N'municipal', '05', '05001', N'aprobado', 1, 3, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),
(109, N'lutier', N'Taller de Lutería Fina y Restauración', N'Lutería Fina S.A.S.', N'Expertos en la restauración de instrumentos de madera acústicos.', N'luteria.fina@pnmc.local', N'3008889900', N'http://luteriafina.local', N'municipal', '05', '05001', N'aprobado', 1, 4, 3, SYSUTCDATETIME(), SYSUTCDATETIME());

-- ESTADO: publicado (Visibles al público en general)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion, FechaPublicacion)
VALUES 
(110, N'organizacion', N'Corporación Artística Batuta Local', N'Batuta Local Regional', N'Sede regional autorizada con cobertura de más de 300 estudiantes.', N'batutalocal@pnmc.local', N'3012223344', N'http://batutalocal.local', N'municipal', '05', '05001', N'publicado', 1, 2, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(111, N'festival', N'Festival Internacional de Jazz Medellín', N'Fundación Jazz Medellin', N'El evento de Jazz más representativo de la región con invitados de 10 países.', N'jazz@pnmc.local', N'3023334455', N'http://jazzmedellin.local', N'municipal', '05', '05001', N'publicado', 1, 2, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(112, N'mercado_musical', N'Mercado Musical del Pacífico y de la Montaña', N'Mercado Pacífico M.', N'Punto de encuentro de compradores internacionales y bandas emergentes.', N'mercado@pnmc.local', N'3044445566', N'http://mercadopacifico.local', N'municipal', '05', '05001', N'publicado', 1, 3, 3, SYSUTCDATETIME(), SYSUTCDATETIME());

-- ESTADO: rechazado (No cumplen criterios)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion)
VALUES 
(113, N'organizacion', N'Asociación Musical del Viento Incompleta', N'Asociación Vientos Inc.', N'Propuesta de banda que no cuenta con NIT ni sede física registrada.', N'vientos@pnmc.local', N'3055556677', N'http://vientos.local', N'municipal', '05', '05001', N'rechazado', 1, 5, 3, SYSUTCDATETIME()),
(114, N'festival', N'Festival Fantasma Sin Planificación', N'Festival Fantasma Inc.', N'Evento propuesto sin cronograma ni patrocinadores definidos.', N'fantasma@pnmc.local', N'3066667788', N'http://fantasma.local', N'municipal', '05', '05001', N'rechazado', 1, 7, 3, SYSUTCDATETIME());

-- ESTADO: archivado (Retirados del flujo activo)
INSERT INTO dbo.Entidades (IdEntidad, TipoEntidad, Nombre, NombreLegal, Descripcion, CorreoContacto, TelefonoContacto, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, IdUsuarioResponsable, FechaCreacion)
VALUES 
(115, N'colectivo', N'Antiguo Colectivo de Vientos y Cañas', N'Antiguo Colectivo Vientos', N'Agrupación disuelta en el año 2024.', N'antiguo@pnmc.local', N'3077778899', N'http://antiguo.local', N'municipal', '05', '05001', N'archivado', 1, 4, 4, SYSUTCDATETIME());

SET IDENTITY_INSERT dbo.Entidades OFF;
GO

-- -------------------------------------------------------------------------
-- 2. POBLAR TABLA: dbo.UsuariosEntidades (Vínculos de Usuarios y Roles de Entidad)
-- -------------------------------------------------------------------------
-- Esto asegura que los perfiles puedan ser vistos y editados por los respectivos creadores
INSERT INTO dbo.UsuariosEntidades (IdUsuario, IdEntidad, RolEntidad, Activo, FechaCreacion)
VALUES 
(4, 100, N'propietario', 1, SYSUTCDATETIME()),
(5, 101, N'propietario', 1, SYSUTCDATETIME()),
(7, 102, N'propietario', 1, SYSUTCDATETIME()),
(4, 103, N'propietario', 1, SYSUTCDATETIME()),
(5, 104, N'propietario', 1, SYSUTCDATETIME()),
(7, 105, N'propietario', 1, SYSUTCDATETIME()),
(5, 106, N'propietario', 1, SYSUTCDATETIME()),
(4, 107, N'propietario', 1, SYSUTCDATETIME()),
(3, 108, N'administrador', 1, SYSUTCDATETIME()),
(4, 109, N'propietario', 1, SYSUTCDATETIME()),
(2, 110, N'administrador', 1, SYSUTCDATETIME()),
(2, 111, N'administrador', 1, SYSUTCDATETIME()),
(3, 112, N'administrador', 1, SYSUTCDATETIME()),
(5, 113, N'propietario', 1, SYSUTCDATETIME()),
(7, 114, N'propietario', 1, SYSUTCDATETIME()),
(4, 115, N'propietario', 1, SYSUTCDATETIME());
GO

-- -------------------------------------------------------------------------
-- 3. POBLAR TABLA: dbo.EntidadesHistorialRevision (Historial de Auditoría de Moderación)
-- -------------------------------------------------------------------------
-- Registra justificaciones ficticias de revisión y estados para hacerlo 100% realista

INSERT INTO dbo.EntidadesHistorialRevision (IdEntidad, IdUsuario, Accion, Comentario, FechaAccion)
VALUES 
-- Historial para en_revision
(103, 4, N'enviar_revision', N'Solicito revisión formal para la Filarmónica Metropolitana. Cumplimos con todos los requisitos.', SYSUTCDATETIME()),
(104, 5, N'enviar_revision', N'Enviado para aprobación pública.', SYSUTCDATETIME()),
(105, 7, N'enviar_revision', N'Enviado por colaborador externo de la comunidad.', SYSUTCDATETIME()),

-- Historial para ajustes_solicitados
(106, 5, N'enviar_revision', N'Solicito revisión.', DATEADD(day, -2, SYSUTCDATETIME())),
(106, 3, N'rechazar', N'Por favor, adjunta la certificación catastral de la sede o corregir la dirección.', DATEADD(day, -1, SYSUTCDATETIME())),

(107, 4, N'enviar_revision', N'Se envía para revisión final.', DATEADD(day, -3, SYSUTCDATETIME())),
(107, 2, N'rechazar', N'La descripción de las actividades del mercado musical no es lo suficientemente detallada.', DATEADD(day, -1, SYSUTCDATETIME())),

-- Historial para aprobados
(108, 3, N'aprobar', N'Verificado por Gestor. Cumple con todos los estándares y NIT correcto.', SYSUTCDATETIME()),
(109, 3, N'aprobar', N'Lutería fina verificada. Documentación física validada.', SYSUTCDATETIME()),

-- Historial para publicados
(110, 2, N'publicar', N'Publicado en el mapa y catálogo nacional.', SYSUTCDATETIME()),
(111, 2, N'publicar', N'Aprobado y publicado para la agenda del mapa local.', SYSUTCDATETIME()),
(112, 2, N'publicar', N'Visibilidad pública concedida.', SYSUTCDATETIME()),

-- Historial para rechazados
(113, 3, N'rechazar', N'Rechazado permanentemente por falta de sustento legal de la organización.', SYSUTCDATETIME()),
(114, 3, N'rechazar', N'Rechazado por ser un registro de prueba no verídico ni planificado.', SYSUTCDATETIME()),

-- Historial para archivados
(115, 4, N'archivar', N'Se archiva voluntariamente por disolución del grupo.', SYSUTCDATETIME());
GO

-- -------------------------------------------------------------------------
-- 4. POBLAR TABLA: dbo.Festivales (Módulo de Contenido Específico)
-- -------------------------------------------------------------------------
-- Registros de Festivales de prueba en todos los estados

DELETE FROM dbo.Festivales WHERE IdFestival >= 100;
GO

SET IDENTITY_INSERT dbo.Festivales ON;

INSERT INTO dbo.Festivales (IdFestival, NombreFestival, Descripcion, Organizador, CorreoFestival, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Activo, EstadoRegistro, FechaCreacion)
VALUES 
(100, N'Festival de Cuerdas de Barichara (Borrador)', N'Festival musical en desarrollo.', N'Taller Cuerdas', N'cuerdas@pnmc.local', N'municipal', '05', '05001', 1, N'borrador', SYSUTCDATETIME()),
(101, N'Encuentro Andino en la Neblina (En Revisión)', N'Festival de música andina tradicional.', N'Neblina Colectivo', N'neblina@pnmc.local', N'municipal', '05', '05001', 1, N'en_revision', SYSUTCDATETIME()),
(102, N'Festival del Pasillo y Vientos (Ajustes)', N'Festival musical con ajustes pendientes.', N'Comité Pasillo', N'pasillo@pnmc.local', N'municipal', '05', '05001', 1, N'ajustes_solicitados', SYSUTCDATETIME()),
(103, N'Festival Nacional del Bambuco Metropolitano (Publicado)', N'El festival de bambuco más grande de la región.', N'Corpbambuco', N'bambuco@pnmc.local', N'municipal', '05', '05001', 1, N'publicado', SYSUTCDATETIME()),
(104, N'Festival Fallido de Rock Local (Rechazado)', N'Propuesta de festival sin viabilidad.', N'NoName', N'noname@pnmc.local', N'municipal', '05', '05001', 1, N'rechazado', SYSUTCDATETIME());

SET IDENTITY_INSERT dbo.Festivales OFF;
GO

-- -------------------------------------------------------------------------
-- 5. POBLAR TABLA: dbo.EscuelasMusica (Módulo de Contenido Específico)
-- -------------------------------------------------------------------------
-- Registros de Escuelas de prueba en todos los estados

DELETE FROM dbo.EscuelasMusica WHERE IdEscuelaMusica >= 100;
GO

SET IDENTITY_INSERT dbo.EscuelasMusica ON;

INSERT INTO dbo.EscuelasMusica (IdEscuelaMusica, NombreEscuela, CategoriaEscuela, TipoEscuela, EntidadResponsable, CorreoContacto, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EscuelaActiva, Activo, EstadoRegistro, FechaCreacion)
VALUES 
(100, N'Semillero Instrumental del Valle (Borrador)', N'Básica', N'Pública', N'Municipio', N'semillero@pnmc.local', N'municipal', '05', '05001', 1, 1, N'borrador', SYSUTCDATETIME()),
(101, N'Escuela de Vientos del Norte (En Revisión)', N'Intermedia', N'Privada', N'Fundación Norte', N'vientos.norte@pnmc.local', N'municipal', '05', '05001', 1, 1, N'en_revision', SYSUTCDATETIME()),
(102, N'Centro de Formación de Guitarras (Ajustes)', N'Avanzada', N'Pública', N'Colectivo', N'guitarras@pnmc.local', N'municipal', '05', '05001', 1, 1, N'ajustes_solicitados', SYSUTCDATETIME()),
(103, N'Escuela de Formación Musical Batuta Medellín (Publicada)', N'Básica-Intermedia', N'Pública', N'Ministerio', N'batuta.med@pnmc.local', N'municipal', '05', '05001', 1, 1, N'publicado', SYSUTCDATETIME()),
(104, N'Escuela Comercial de Canto Express (Rechazada)', N'Ninguna', N'Privada', N'Particular', N'express@pnmc.local', N'municipal', '05', '05001', 0, 1, N'rechazado', SYSUTCDATETIME());

SET IDENTITY_INSERT dbo.EscuelasMusica OFF;
GO

-- -------------------------------------------------------------------------
-- 6. POBLAR TABLA: dbo.Lutieres (Módulo de Contenido Específico)
-- -------------------------------------------------------------------------
-- Registros de Lutieres de prueba en todos los estados

DELETE FROM dbo.Lutieres WHERE IdLutier >= 100;
GO

SET IDENTITY_INSERT dbo.Lutieres ON;

INSERT INTO dbo.Lutieres (IdLutier, Nombre, TipoLutier, NombreTaller, Especialidad, CorreoContacto, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Activo, EstadoRegistro, FechaCreacion)
VALUES 
(100, N'Carlos Viento Arpa (Borrador)', N'individual', N'Taller Carlos Arpas', N'Arpas llaneras', N'carlos@pnmc.local', N'municipal', '05', '05001', 1, N'borrador', SYSUTCDATETIME()),
(101, N'Taller de Violines La Sonata (En Revisión)', N'taller', N'La Sonata Lutieres', N'Violines y violonchelos', N'sonata@pnmc.local', N'municipal', '05', '05001', 1, N'en_revision', SYSUTCDATETIME()),
(102, N'Lutier de Percusión Menor (Ajustes)', N'individual', N'Taller Percusión', N'Tambores y maracas', N'percusión@pnmc.local', N'municipal', '05', '05001', 1, N'ajustes_solicitados', SYSUTCDATETIME()),
(103, N'Taller de Guitarras Clásicas Ramírez (Publicado)', N'taller', N'Guitarras Ramírez', N'Guitarras clásicas y acústicas', N'ramirez@pnmc.local', N'municipal', '05', '05001', 1, N'publicado', SYSUTCDATETIME()),
(104, N'Fabricante de Guitarras de Juguete (Rechazado)', N'individual', N'Juguetes', N'Guitarras plásticas sin afinación', N'juguete@pnmc.local', N'municipal', '05', '05001', 1, N'rechazado', SYSUTCDATETIME());

SET IDENTITY_INSERT dbo.Lutieres OFF;
GO

PRINT '=====================================================';
PRINT 'DATOS DE PRUEBA EXHAUSTIVOS CARGADOS EXITOSAMENTE';
PRINT '=====================================================';
