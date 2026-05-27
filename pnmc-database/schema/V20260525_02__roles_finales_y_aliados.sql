/*
    PNMC - Correccion incremental de roles finales y modelo de aliados.
    Esta migracion evita alias runtime: migra datos existentes a la nomenclatura final
    y prepara tablas con alcance por EntidadAliadaId.
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

DECLARE @RolWebmaster int = (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'webmaster');
DECLARE @RolGestorInterno int = (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'gestor_interno');
DECLARE @RolAliadoAdmin int = (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_admin');
DECLARE @RolAliadoEditor int = (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_editor');
DECLARE @RolExterno int = (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'externo');

UPDATE usuario
SET IdRol = CASE rol.NombreRol
    WHEN N'administrador' THEN @RolWebmaster
    WHEN N'admin' THEN @RolWebmaster
    WHEN N'editor' THEN @RolGestorInterno
    WHEN N'lider' THEN @RolGestorInterno
    WHEN N'lider_de_componente' THEN @RolGestorInterno
    WHEN N'lider-componente' THEN @RolGestorInterno
    WHEN N'aliado' THEN @RolAliadoAdmin
    WHEN N'gestor' THEN @RolExterno
    WHEN N'cargador' THEN @RolExterno
    WHEN N'contributor' THEN @RolExterno
    WHEN N'usuario_externo' THEN @RolExterno
    WHEN N'colaborador_admin' THEN @RolAliadoAdmin
    WHEN N'colaborador_editor' THEN @RolAliadoEditor
    WHEN N'colaborador_lector' THEN (SELECT TOP 1 IdRol FROM dbo.Roles WHERE NombreRol = N'aliado_lector')
    ELSE usuario.IdRol
END
FROM dbo.Usuarios usuario
INNER JOIN dbo.Roles rol ON rol.IdRol = usuario.IdRol
WHERE rol.NombreRol IN (
    N'administrador', N'admin', N'editor', N'lider', N'lider_de_componente',
    N'lider-componente', N'aliado', N'gestor', N'cargador', N'contributor',
    N'usuario_externo', N'colaborador_admin', N'colaborador_editor', N'colaborador_lector'
);

DELETE rol
FROM dbo.Roles rol
WHERE rol.NombreRol IN (
    N'administrador', N'admin', N'editor', N'lider', N'lider_de_componente',
    N'lider-componente', N'aliado', N'gestor', N'cargador', N'contributor',
    N'usuario_externo', N'colaborador_admin', N'colaborador_editor', N'colaborador_lector'
)
AND NOT EXISTS (SELECT 1 FROM dbo.Usuarios usuario WHERE usuario.IdRol = rol.IdRol);

IF OBJECT_ID(N'dbo.EntidadesColaboradoras', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.EntidadesAliadas', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.EntidadesColaboradoras', N'EntidadesAliadas';
END;

IF OBJECT_ID(N'dbo.UsuariosEntidadesColaboradoras', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.UsuariosEntidadesAliadas', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.UsuariosEntidadesColaboradoras', N'UsuariosEntidadesAliadas';
END;

IF OBJECT_ID(N'dbo.EntidadesAliadas', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.EntidadesAliadas', N'IdEntidadColaboradora') IS NOT NULL
       AND COL_LENGTH(N'dbo.EntidadesAliadas', N'IdEntidadAliada') IS NULL
        EXEC sp_rename N'dbo.EntidadesAliadas.IdEntidadColaboradora', N'IdEntidadAliada', N'COLUMN';

    IF COL_LENGTH(N'dbo.EntidadesAliadas', N'Departamento') IS NOT NULL
       AND COL_LENGTH(N'dbo.EntidadesAliadas', N'CodigoDepartamento') IS NULL
        EXEC sp_rename N'dbo.EntidadesAliadas.Departamento', N'CodigoDepartamento', N'COLUMN';

    IF COL_LENGTH(N'dbo.EntidadesAliadas', N'Municipio') IS NOT NULL
       AND COL_LENGTH(N'dbo.EntidadesAliadas', N'CodigoMunicipio') IS NULL
        EXEC sp_rename N'dbo.EntidadesAliadas.Municipio', N'CodigoMunicipio', N'COLUMN';
END;

IF OBJECT_ID(N'dbo.UsuariosEntidadesAliadas', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'IdUsuarioEntidadColaboradora') IS NOT NULL
       AND COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'IdUsuarioEntidadAliada') IS NULL
        EXEC sp_rename N'dbo.UsuariosEntidadesAliadas.IdUsuarioEntidadColaboradora', N'IdUsuarioEntidadAliada', N'COLUMN';

    IF COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'EntidadColaboradoraId') IS NOT NULL
       AND COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'EntidadAliadaId') IS NULL
        EXEC sp_rename N'dbo.UsuariosEntidadesAliadas.EntidadColaboradoraId', N'EntidadAliadaId', N'COLUMN';

    IF COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'RolEnEntidad') IS NOT NULL
       AND COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'RolAliado') IS NULL
        EXEC sp_rename N'dbo.UsuariosEntidadesAliadas.RolEnEntidad', N'RolAliado', N'COLUMN';

    IF COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'Estado') IS NULL
        ALTER TABLE dbo.UsuariosEntidadesAliadas ADD Estado nvarchar(40) NOT NULL CONSTRAINT DF_UsuariosEntidadesAliadas_Estado DEFAULT (N'activo');

    IF COL_LENGTH(N'dbo.UsuariosEntidadesAliadas', N'AliadoAdminId') IS NULL
        ALTER TABLE dbo.UsuariosEntidadesAliadas ADD AliadoAdminId int NULL;

    UPDATE dbo.UsuariosEntidadesAliadas
    SET RolAliado = CASE RolAliado
        WHEN N'admin_entidad' THEN N'aliado_admin'
        WHEN N'editor_entidad' THEN N'aliado_editor'
        WHEN N'lector_entidad' THEN N'aliado_lector'
        ELSE RolAliado
    END;

    IF OBJECT_ID(N'dbo.CK_UsuariosEntidadesColaboradoras_Rol', N'C') IS NOT NULL
        ALTER TABLE dbo.UsuariosEntidadesAliadas DROP CONSTRAINT CK_UsuariosEntidadesColaboradoras_Rol;

    IF OBJECT_ID(N'dbo.CK_UsuariosEntidadesAliadas_Rol', N'C') IS NULL
        ALTER TABLE dbo.UsuariosEntidadesAliadas
        ADD CONSTRAINT CK_UsuariosEntidadesAliadas_Rol CHECK (RolAliado IN (N'aliado_admin', N'aliado_editor', N'aliado_lector'));
END;

IF OBJECT_ID(N'dbo.EntidadesAliadas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EntidadesAliadas (
        IdEntidadAliada int IDENTITY(1,1) NOT NULL,
        Nombre nvarchar(240) NOT NULL,
        TipoEntidad nvarchar(120) NULL,
        Nit nvarchar(80) NULL,
        CodigoDepartamento nvarchar(10) NULL,
        CodigoMunicipio nvarchar(10) NULL,
        CorreoInstitucional nvarchar(320) NULL,
        TelefonoInstitucional nvarchar(80) NULL,
        SitioWeb nvarchar(500) NULL,
        LogoUrl nvarchar(500) NULL,
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_EntidadesAliadas_Estado DEFAULT (N'pendiente'),
        CreadaPorUsuarioId int NULL,
        FechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_EntidadesAliadas_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion datetime2(0) NOT NULL CONSTRAINT DF_EntidadesAliadas_FechaActualizacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_EntidadesAliadas PRIMARY KEY (IdEntidadAliada),
        CONSTRAINT CK_EntidadesAliadas_Estado CHECK (Estado IN (N'activa', N'inactiva', N'pendiente', N'suspendida'))
    );
END;

IF OBJECT_ID(N'dbo.UsuariosEntidadesAliadas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuariosEntidadesAliadas (
        IdUsuarioEntidadAliada int IDENTITY(1,1) NOT NULL,
        UsuarioId int NOT NULL,
        EntidadAliadaId int NOT NULL,
        RolAliado nvarchar(40) NOT NULL,
        AliadoAdminId int NULL,
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_UsuariosEntidadesAliadas_Estado DEFAULT (N'activo'),
        Activo bit NOT NULL CONSTRAINT DF_UsuariosEntidadesAliadas_Activo DEFAULT (1),
        FechaVinculacion datetime2(0) NOT NULL CONSTRAINT DF_UsuariosEntidadesAliadas_Fecha DEFAULT (SYSUTCDATETIME()),
        CreadoPorUsuarioId int NULL,
        CONSTRAINT PK_UsuariosEntidadesAliadas PRIMARY KEY (IdUsuarioEntidadAliada),
        CONSTRAINT FK_UsuariosEntidadesAliadas_Usuarios FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (IdUsuario),
        CONSTRAINT FK_UsuariosEntidadesAliadas_EntidadesAliadas FOREIGN KEY (EntidadAliadaId) REFERENCES dbo.EntidadesAliadas (IdEntidadAliada),
        CONSTRAINT CK_UsuariosEntidadesAliadas_Rol CHECK (RolAliado IN (N'aliado_admin', N'aliado_editor', N'aliado_lector')),
        CONSTRAINT CK_UsuariosEntidadesAliadas_Estado CHECK (Estado IN (N'activo', N'inactivo', N'pendiente', N'suspendido'))
    );
END;

IF OBJECT_ID(N'dbo.SolicitudesAliado', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SolicitudesAliado (
        IdSolicitudAliado bigint IDENTITY(1,1) NOT NULL,
        NombreEntidad nvarchar(240) NOT NULL,
        TipoEntidad nvarchar(120) NULL,
        Nit nvarchar(80) NULL,
        CodigoDepartamento nvarchar(10) NULL,
        CodigoMunicipio nvarchar(10) NULL,
        CorreoInstitucional nvarchar(320) NOT NULL,
        TelefonoInstitucional nvarchar(80) NULL,
        NombreAdministrador nvarchar(240) NOT NULL,
        CorreoAdministrador nvarchar(320) NOT NULL,
        Estado nvarchar(40) NOT NULL CONSTRAINT DF_SolicitudesAliado_Estado DEFAULT (N'pendiente'),
        ComentarioRevision nvarchar(1200) NULL,
        UsuarioRevisorId int NULL,
        EntidadAliadaId int NULL,
        FechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_SolicitudesAliado_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion datetime2(0) NOT NULL CONSTRAINT DF_SolicitudesAliado_FechaActualizacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_SolicitudesAliado PRIMARY KEY (IdSolicitudAliado),
        CONSTRAINT CK_SolicitudesAliado_Estado CHECK (Estado IN (N'pendiente', N'en_revision', N'ajustes_solicitados', N'aprobada', N'rechazada', N'cancelada'))
    );
END;

IF COL_LENGTH(N'dbo.RegistrosRevisionHistorial', N'IdEntidadColaboradora') IS NOT NULL
   AND COL_LENGTH(N'dbo.RegistrosRevisionHistorial', N'IdEntidadAliada') IS NULL
BEGIN
    EXEC sp_rename N'dbo.RegistrosRevisionHistorial.IdEntidadColaboradora', N'IdEntidadAliada', N'COLUMN';
END;

IF COL_LENGTH(N'dbo.RegistrosRevisionHistorial', N'IdEntidadAliada') IS NULL
BEGIN
    ALTER TABLE dbo.RegistrosRevisionHistorial ADD IdEntidadAliada int NULL;
END;
