using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace PNMC.Infrastructure.Data;

public static class DatabaseBootstrapper
{
    public static async Task EnsureReadyAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseBootstrapper");
        var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var timeoutSeconds = Math.Clamp(options.StartupTimeoutSeconds, 5, 300);
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));
        var startupToken = timeoutCts.Token;

        try
        {
            if (db.Database.IsSqlServer())
            {
                var canConnect = await db.Database.CanConnectAsync(startupToken);
                if (!canConnect)
                {
                    throw new InvalidOperationException("No fue posible conectar con SQL Server.");
                }

                if (options.EnsureSupportTables)
                {
                    await EnsureAdministrationSupportTablesAsync(db, configuration, startupToken);
                    await EnsureEntityAdministrationTablesAsync(db, startupToken);
                    await EnsureParticipationSupportTableAsync(db, startupToken);
                    await EnsureEditorialCatalogTableAsync(db, startupToken);
                    await EnsureRecordGovernanceTablesAsync(db, startupToken);
                }

                logger.LogInformation("SQL Server connection established and support tables verified.");
                return;
            }

            await db.Database.EnsureCreatedAsync(startupToken);
            await EnsureLocalSupportTablesAsync(db, startupToken);
            await EnsureLocalDevelopmentSeedAsync(db, startupToken);
            logger.LogInformation("Database initialized with EnsureCreated for non-SQL provider.");
        }
        catch (Exception exception) when (options.ContinueOnStartupFailure)
        {
            logger.LogWarning(
                exception,
                "Database bootstrap failed at startup. The API will continue running in degraded mode. TimeoutSeconds={TimeoutSeconds}",
                timeoutSeconds);
        }
    }

    private static async Task EnsureAdministrationSupportTablesAsync(
        PnmcDbContext db,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        const string sql = """
            IF OBJECT_ID(N'[Roles]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Roles] (
                    [IdRol] int IDENTITY(1,1) NOT NULL,
                    [NombreRol] nvarchar(80) NOT NULL,
                    [DescripcionRol] nvarchar(500) NULL,
                    CONSTRAINT [PK_Roles] PRIMARY KEY ([IdRol]),
                    CONSTRAINT [UQ_Roles_NombreRol] UNIQUE ([NombreRol])
                );
            END;

            IF OBJECT_ID(N'[Usuarios]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Usuarios] (
                    [IdUsuario] int IDENTITY(1,1) NOT NULL,
                    [NombreCompleto] nvarchar(180) NOT NULL,
                    [CorreoElectronico] nvarchar(180) NOT NULL,
                    [HashContrasena] nvarchar(500) NOT NULL,
                    [IdRol] int NOT NULL,
                    [CanalAcceso] nvarchar(40) NOT NULL CONSTRAINT [DF_Usuarios_CanalAcceso] DEFAULT (N'interno'),
                    [TipoPerfil] nvarchar(80) NULL,
                    [Activo] bit NOT NULL CONSTRAINT [DF_Usuarios_Activo] DEFAULT (1),
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_Usuarios_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NULL,
                    [UltimoAcceso] datetime2(0) NULL,
                    CONSTRAINT [PK_Usuarios] PRIMARY KEY ([IdUsuario]),
                    CONSTRAINT [UQ_Usuarios_CorreoElectronico] UNIQUE ([CorreoElectronico]),
                    CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY ([IdRol]) REFERENCES [Roles] ([IdRol])
                );
            END;

            IF COL_LENGTH(N'[Usuarios]', N'CanalAcceso') IS NULL
            BEGIN
                ALTER TABLE [Usuarios]
                ADD [CanalAcceso] nvarchar(40) NOT NULL
                    CONSTRAINT [DF_Usuarios_CanalAcceso] DEFAULT (N'interno') WITH VALUES;
            END;

            IF COL_LENGTH(N'[Usuarios]', N'TipoPerfil') IS NULL
            BEGIN
                ALTER TABLE [Usuarios]
                ADD [TipoPerfil] nvarchar(80) NULL;
            END;

            IF COL_LENGTH(N'[Usuarios]', N'Telefono') IS NULL
            BEGIN
                ALTER TABLE [Usuarios]
                ADD [Telefono] nvarchar(80) NULL;
            END;

            IF OBJECT_ID(N'[BitacoraAuditoria]', N'U') IS NULL
            BEGIN
                CREATE TABLE [BitacoraAuditoria] (
                    [IdAuditoria] bigint IDENTITY(1,1) NOT NULL,
                    [IdUsuario] int NULL,
                    [TablaAfectada] nvarchar(160) NOT NULL,
                    [IdRegistroAfectado] nvarchar(120) NOT NULL,
                    [Accion] nvarchar(40) NOT NULL,
                    [ValoresAnteriores] nvarchar(max) NULL,
                    [ValoresNuevos] nvarchar(max) NULL,
                    [FechaAccion] datetime2(0) NOT NULL CONSTRAINT [DF_BitacoraAuditoria_FechaAccion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_BitacoraAuditoria] PRIMARY KEY ([IdAuditoria]),
                    CONSTRAINT [FK_BitacoraAuditoria_Usuarios] FOREIGN KEY ([IdUsuario]) REFERENCES [Usuarios] ([IdUsuario])
                );
            END;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'[RegistrosRevisionHistorial]', N'U') IS NULL
            BEGIN
                CREATE TABLE [RegistrosRevisionHistorial] (
                    [IdRevisionHistorial] bigint IDENTITY(1,1) NOT NULL,
                    [ModuloId] nvarchar(80) NOT NULL,
                    [RegistroId] nvarchar(120) NOT NULL,
                    [EstadoAnterior] nvarchar(80) NULL,
                    [EstadoNuevo] nvarchar(80) NOT NULL,
                    [Accion] nvarchar(80) NOT NULL,
                    [Comentario] nvarchar(1200) NULL,
                    [MotivoRechazo] nvarchar(1200) NULL,
                    [CamposObservados] nvarchar(max) NULL,
                    [IdUsuario] int NULL,
                    [IdEntidadAliada] int NULL,
                    [Fecha] datetime2(0) NOT NULL CONSTRAINT [DF_RegistrosRevisionHistorial_Fecha] DEFAULT (SYSUTCDATETIME()),
                    [MetadataJson] nvarchar(max) NULL,
                    CONSTRAINT [PK_RegistrosRevisionHistorial] PRIMARY KEY ([IdRevisionHistorial])
                );
            END;
            """, cancellationToken);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'[EntidadesAliadas]', N'U') IS NULL
            BEGIN
                CREATE TABLE [EntidadesAliadas] (
                    [IdEntidadAliada] int IDENTITY(1,1) NOT NULL,
                    [Nombre] nvarchar(240) NOT NULL,
                    [TipoEntidad] nvarchar(120) NULL,
                    [Nit] nvarchar(80) NULL,
                    [CodigoDepartamento] nvarchar(10) NULL,
                    [CodigoMunicipio] nvarchar(10) NULL,
                    [CorreoInstitucional] nvarchar(320) NULL,
                    [TelefonoInstitucional] nvarchar(80) NULL,
                    [SitioWeb] nvarchar(500) NULL,
                    [LogoUrl] nvarchar(500) NULL,
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_EntidadesAliadas_Estado] DEFAULT (N'pendiente'),
                    [CreadaPorUsuarioId] int NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_EntidadesAliadas_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NOT NULL CONSTRAINT [DF_EntidadesAliadas_FechaActualizacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_EntidadesAliadas] PRIMARY KEY ([IdEntidadAliada])
                );
            END;

            IF OBJECT_ID(N'[UsuariosEntidadesAliadas]', N'U') IS NULL
            BEGIN
                CREATE TABLE [UsuariosEntidadesAliadas] (
                    [IdUsuarioEntidadAliada] int IDENTITY(1,1) NOT NULL,
                    [UsuarioId] int NOT NULL,
                    [EntidadAliadaId] int NOT NULL,
                    [RolAliado] nvarchar(40) NOT NULL,
                    [AliadoAdminId] int NULL,
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_UsuariosEntidadesAliadas_Estado] DEFAULT (N'activo'),
                    [Activo] bit NOT NULL CONSTRAINT [DF_UsuariosEntidadesAliadas_Activo] DEFAULT (1),
                    [FechaVinculacion] datetime2(0) NOT NULL CONSTRAINT [DF_UsuariosEntidadesAliadas_Fecha] DEFAULT (SYSUTCDATETIME()),
                    [CreadoPorUsuarioId] int NULL,
                    CONSTRAINT [PK_UsuariosEntidadesAliadas] PRIMARY KEY ([IdUsuarioEntidadAliada]),
                    CONSTRAINT [FK_UsuariosEntidadesAliadas_Usuarios] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([IdUsuario]),
                    CONSTRAINT [FK_UsuariosEntidadesAliadas_EntidadesAliadas] FOREIGN KEY ([EntidadAliadaId]) REFERENCES [EntidadesAliadas] ([IdEntidadAliada])
                );
            END;

            IF OBJECT_ID(N'[SolicitudesAliado]', N'U') IS NULL
            BEGIN
                CREATE TABLE [SolicitudesAliado] (
                    [IdSolicitudAliado] bigint IDENTITY(1,1) NOT NULL,
                    [NombreEntidad] nvarchar(240) NOT NULL,
                    [TipoEntidad] nvarchar(120) NULL,
                    [Nit] nvarchar(80) NULL,
                    [CodigoDepartamento] nvarchar(10) NULL,
                    [CodigoMunicipio] nvarchar(10) NULL,
                    [CorreoInstitucional] nvarchar(320) NOT NULL,
                    [TelefonoInstitucional] nvarchar(80) NULL,
                    [NombreAdministrador] nvarchar(240) NOT NULL,
                    [CorreoAdministrador] nvarchar(320) NOT NULL,
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_SolicitudesAliado_Estado] DEFAULT (N'pendiente'),
                    [ComentarioRevision] nvarchar(1200) NULL,
                    [UsuarioRevisorId] int NULL,
                    [EntidadAliadaId] int NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_SolicitudesAliado_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NOT NULL CONSTRAINT [DF_SolicitudesAliado_FechaActualizacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_SolicitudesAliado] PRIMARY KEY ([IdSolicitudAliado])
                );
            END;

            IF OBJECT_ID(N'[Notificaciones]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Notificaciones] (
                    [IdNotificacion] bigint IDENTITY(1,1) NOT NULL,
                    [UsuarioDestinatarioId] int NULL,
                    [CorreoDestinatario] nvarchar(320) NULL,
                    [TipoEvento] nvarchar(100) NOT NULL,
                    [Canal] nvarchar(40) NOT NULL CONSTRAINT [DF_Notificaciones_Canal] DEFAULT (N'internal'),
                    [Titulo] nvarchar(240) NOT NULL,
                    [Cuerpo] nvarchar(2000) NOT NULL,
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_Notificaciones_Estado] DEFAULT (N'pendiente'),
                    [ModuloId] nvarchar(80) NULL,
                    [RegistroId] nvarchar(120) NULL,
                    [MetadataJson] nvarchar(max) NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_Notificaciones_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaEnvio] datetime2(0) NULL,
                    [FechaLectura] datetime2(0) NULL,
                    [Intentos] int NOT NULL CONSTRAINT [DF_Notificaciones_Intentos] DEFAULT (0),
                    [Error] nvarchar(1200) NULL,
                    CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([IdNotificacion]),
                    CONSTRAINT [FK_Notificaciones_Usuarios] FOREIGN KEY ([UsuarioDestinatarioId]) REFERENCES [Usuarios] ([IdUsuario])
                );

                CREATE INDEX [IX_Notificaciones_Destinatario] ON [Notificaciones] ([UsuarioDestinatarioId], [FechaCreacion] DESC);
                CREATE INDEX [IX_Notificaciones_Correo] ON [Notificaciones] ([CorreoDestinatario], [FechaCreacion] DESC);
            END;
            """, cancellationToken);

        await EnsureRoleAsync(db, "webmaster", "Control total de usuarios, modulos, datos, configuracion, revision, publicacion y mantenimiento.", cancellationToken);
        await EnsureRoleAsync(db, "gestor_interno", "Segundo nivel general de administracion institucional.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_admin", "Administrador de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_editor", "Usuario operativo de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_lector", "Usuario de consulta de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "externo", "Participante publico sin acceso administrativo privilegiado.", cancellationToken);

        if (configuration.GetValue<bool>("Database:SeedBootstrapUsers"))
        {
            await EnsureBootstrapUserAsync(
                db,
                "Webmaster PNMC",
                "admin@pnmc.local",
                "webmaster",
                "admin",
                "3151234567",
                cancellationToken);

            await EnsureBootstrapUserAsync(
                db,
                "Gestor Interno PNMC",
                "gestor@pnmc.local",
                "gestor_interno",
                "admin",
                "3207654321",
                cancellationToken);
        }
    }

    private static async Task EnsureRecordGovernanceTablesAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'[SolicitudesVinculacionRegistros]', N'U') IS NULL
            BEGIN
                CREATE TABLE [SolicitudesVinculacionRegistros] (
                    [IdSolicitudVinculacionRegistro] bigint IDENTITY(1,1) NOT NULL,
                    [ModuloId] nvarchar(80) NOT NULL,
                    [RegistroId] nvarchar(120) NOT NULL,
                    [UsuarioSolicitanteId] int NOT NULL,
                    [EntidadAliadaId] int NULL,
                    [AlcanceSolicitado] nvarchar(40) NOT NULL CONSTRAINT [DF_SolicitudesVinculacionRegistros_Alcance] DEFAULT (N'responsable'),
                    [Justificacion] nvarchar(1200) NOT NULL,
                    [EvidenciaTexto] nvarchar(2000) NULL,
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_SolicitudesVinculacionRegistros_Estado] DEFAULT (N'pendiente'),
                    [UsuarioRevisorId] int NULL,
                    [ComentarioRevision] nvarchar(1200) NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_SolicitudesVinculacionRegistros_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NOT NULL CONSTRAINT [DF_SolicitudesVinculacionRegistros_FechaActualizacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_SolicitudesVinculacionRegistros] PRIMARY KEY ([IdSolicitudVinculacionRegistro]),
                    CONSTRAINT [FK_SolicitudesVinculacionRegistros_Usuario] FOREIGN KEY ([UsuarioSolicitanteId]) REFERENCES [Usuarios] ([IdUsuario])
                );

                CREATE INDEX [IX_SolicitudesVinculacionRegistros_Estado] ON [SolicitudesVinculacionRegistros] ([Estado], [FechaActualizacion] DESC);
                CREATE INDEX [IX_SolicitudesVinculacionRegistros_Registro] ON [SolicitudesVinculacionRegistros] ([ModuloId], [RegistroId]);
            END;

            IF OBJECT_ID(N'[RegistrosDuplicadosCandidatos]', N'U') IS NULL
            BEGIN
                CREATE TABLE [RegistrosDuplicadosCandidatos] (
                    [IdDuplicadoCandidato] bigint IDENTITY(1,1) NOT NULL,
                    [ModuloId] nvarchar(80) NOT NULL,
                    [RegistroOrigenId] nvarchar(120) NOT NULL,
                    [RegistroCandidatoId] nvarchar(120) NOT NULL,
                    [NivelCoincidencia] nvarchar(20) NOT NULL,
                    [PuntajeCoincidencia] decimal(5,2) NULL,
                    [EvidenciaJson] nvarchar(max) NOT NULL CONSTRAINT [DF_RegistrosDuplicadosCandidatos_Evidencia] DEFAULT (N'{{}}'),
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_RegistrosDuplicadosCandidatos_Estado] DEFAULT (N'pendiente'),
                    [Decision] nvarchar(40) NULL,
                    [ComentarioDecision] nvarchar(1200) NULL,
                    [UsuarioRevisorId] int NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_RegistrosDuplicadosCandidatos_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NOT NULL CONSTRAINT [DF_RegistrosDuplicadosCandidatos_FechaActualizacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_RegistrosDuplicadosCandidatos] PRIMARY KEY ([IdDuplicadoCandidato])
                );

                CREATE INDEX [IX_RegistrosDuplicadosCandidatos_Estado] ON [RegistrosDuplicadosCandidatos] ([Estado], [FechaActualizacion] DESC);
                CREATE INDEX [IX_RegistrosDuplicadosCandidatos_Registro] ON [RegistrosDuplicadosCandidatos] ([ModuloId], [RegistroOrigenId], [RegistroCandidatoId]);
            END;

            IF OBJECT_ID(N'[RegistrosCalidadDatos]', N'U') IS NULL
            BEGIN
                CREATE TABLE [RegistrosCalidadDatos] (
                    [IdRegistroCalidadDatos] bigint IDENTITY(1,1) NOT NULL,
                    [ModuloId] nvarchar(80) NOT NULL,
                    [RegistroId] nvarchar(120) NOT NULL,
                    [TipoBandera] nvarchar(80) NOT NULL,
                    [Severidad] nvarchar(20) NOT NULL CONSTRAINT [DF_RegistrosCalidadDatos_Severidad] DEFAULT (N'media'),
                    [Estado] nvarchar(40) NOT NULL CONSTRAINT [DF_RegistrosCalidadDatos_Estado] DEFAULT (N'abierta'),
                    [Detalle] nvarchar(1200) NULL,
                    [CreadoPorUsuarioId] int NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_RegistrosCalidadDatos_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NOT NULL CONSTRAINT [DF_RegistrosCalidadDatos_FechaActualizacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_RegistrosCalidadDatos] PRIMARY KEY ([IdRegistroCalidadDatos])
                );

                CREATE INDEX [IX_RegistrosCalidadDatos_Estado] ON [RegistrosCalidadDatos] ([Estado], [FechaActualizacion] DESC);
                CREATE INDEX [IX_RegistrosCalidadDatos_Registro] ON [RegistrosCalidadDatos] ([ModuloId], [RegistroId]);
            END;
            """, cancellationToken);
    }

    private static async Task EnsureRoleAsync(
        PnmcDbContext db,
        string name,
        string description,
        CancellationToken cancellationToken)
    {
        var role = await db.Roles.FirstOrDefaultAsync(item => item.Name == name, cancellationToken);
        if (role is null)
        {
            db.Roles.Add(new RoleRow
            {
                Name = name,
                Description = description
            });
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        role.Description = description;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureBootstrapUserAsync(
        PnmcDbContext db,
        string fullName,
        string email,
        string roleName,
        string password,
        string? phone,
        CancellationToken cancellationToken)
    {
        var role = await db.Roles.FirstAsync(item => item.Name == roleName, cancellationToken);
        var user = await db.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
        var isNew = user is null;

        user ??= new UserRow
        {
            FullName = fullName,
            Email = email,
            CreatedAt = DateTime.UtcNow
        };

        user.FullName = fullName;
        user.RoleId = role.Id;
        user.AccessChannel = roleName switch
        {
            "aliado_admin" or "aliado_editor" or "aliado_lector" => "aliado",
            "externo" => "externo",
            _ => "interno"
        };
        user.ProfileType = roleName == "externo" ? "organizacion" : user.ProfileType;
        user.Telefono = phone;
        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        if (isNew || !LooksLikeAspNetPasswordHash(user.PasswordHash))
        {
            var hasher = new PasswordHasher<UserRow>();
            user.PasswordHash = hasher.HashPassword(user, password);
        }

        if (isNew)
        {
            db.Users.Add(user);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureLocalDevelopmentSeedAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        await EnsureRoleAsync(db, "webmaster", "Control total de usuarios, modulos, datos, configuracion, revision, publicacion y mantenimiento.", cancellationToken);
        await EnsureRoleAsync(db, "gestor_interno", "Segundo nivel general de administracion institucional.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_admin", "Administrador de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_editor", "Usuario operativo de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "aliado_lector", "Usuario de consulta de una entidad aliada aprobada.", cancellationToken);
        await EnsureRoleAsync(db, "externo", "Participante publico sin acceso administrativo privilegiado.", cancellationToken);

        await EnsureContentStatusAsync(db, "borrador", "Borrador", "Registro en elaboracion.", cancellationToken);
        await EnsureContentStatusAsync(db, "en_revision", "En revision", "Registro enviado para revision interna.", cancellationToken);
        await EnsureContentStatusAsync(db, "ajustes_solicitados", "Ajustes solicitados", "Registro devuelto para correcciones.", cancellationToken);
        await EnsureContentStatusAsync(db, "aprobado", "Aprobado", "Registro validado internamente.", cancellationToken);
        await EnsureContentStatusAsync(db, "publicado", "Publicado", "Registro visible publicamente.", cancellationToken);
        await EnsureContentStatusAsync(db, "rechazado", "Rechazado", "Registro no aprobado.", cancellationToken);
        await EnsureContentStatusAsync(db, "archivado", "Archivado", "Registro retirado del flujo activo.", cancellationToken);

        await EnsureBootstrapUserAsync(db, "Webmaster PNMC", "admin@pnmc.local", "webmaster", "admin", "3151234567", cancellationToken);
        await EnsureBootstrapUserAsync(db, "Gestor Interno PNMC", "gestor@pnmc.local", "gestor_interno", "admin", "3207654321", cancellationToken);
        await EnsureBootstrapUserAsync(db, "Aliado Administrador", "aliado-admin@pnmc.local", "aliado_admin", "admin", "3004445566", cancellationToken);
        await EnsureBootstrapUserAsync(db, "Aliado Editor", "aliado-editor@pnmc.local", "aliado_editor", "admin", "3119998877", cancellationToken);
        await EnsureBootstrapUserAsync(db, "Aliado Lector", "aliado-lector@pnmc.local", "aliado_lector", "admin", "3146665544", cancellationToken);
        await EnsureBootstrapUserAsync(db, "Colaborador Externo", "externo@pnmc.local", "externo", "admin", "3103332211", cancellationToken);

        await EnsureDivipolaLocationAsync(db, "05", "Antioquia", "05001", "Medellin", cancellationToken);
        await EnsureDivipolaLocationAsync(db, "11", "Bogota, D.C.", "11001", "Bogota, D.C.", cancellationToken);
        await EnsureDivipolaLocationAsync(db, "13", "Bolivar", "13001", "Cartagena de Indias", cancellationToken);
        await EnsureDivipolaLocationAsync(db, "25", "Cundinamarca", "25754", "Soacha", cancellationToken);
        await EnsureDivipolaLocationAsync(db, "76", "Valle del Cauca", "76001", "Cali", cancellationToken);

        await EnsureLocalAllySeedAsync(db, cancellationToken);
        await EnsureLocalEcosystemSeedAsync(db, cancellationToken);
    }

    private static async Task EnsureLocalSupportTablesAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS RegistrosRevisionHistorial (
                IdRevisionHistorial INTEGER PRIMARY KEY AUTOINCREMENT,
                ModuloId TEXT NOT NULL,
                RegistroId TEXT NOT NULL,
                EstadoAnterior TEXT NULL,
                EstadoNuevo TEXT NOT NULL,
                Accion TEXT NOT NULL,
                Comentario TEXT NULL,
                MotivoRechazo TEXT NULL,
                CamposObservados TEXT NULL,
                IdUsuario INTEGER NULL,
                IdEntidadAliada INTEGER NULL,
                Fecha TEXT NOT NULL,
                MetadataJson TEXT NULL
            );
            """, cancellationToken);
    }

    private static async Task EnsureContentStatusAsync(
        PnmcDbContext db,
        string code,
        string name,
        string description,
        CancellationToken cancellationToken)
    {
        var status = await db.ContentStatuses.FirstOrDefaultAsync(item => item.Code == code, cancellationToken);
        if (status is null)
        {
            db.ContentStatuses.Add(new ContentStatusRow
            {
                Code = code,
                Name = name,
                Description = description
            });
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        status.Name = name;
        status.Description = description;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureDivipolaLocationAsync(
        PnmcDbContext db,
        string departmentCode,
        string departmentName,
        string municipalityCode,
        string municipalityName,
        CancellationToken cancellationToken)
    {
        var location = await db.DivipolaLocations.FirstOrDefaultAsync(
            item => item.DepartmentCode == departmentCode && item.MunicipalityCode == municipalityCode,
            cancellationToken);
        if (location is null)
        {
            db.DivipolaLocations.Add(new DivipolaLocationRow
            {
                DepartmentCode = departmentCode,
                DepartmentName = departmentName,
                MunicipalityCode = municipalityCode,
                MunicipalityName = municipalityName,
                LocationType = "MUNICIPALITY"
            });
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        location.DepartmentName = departmentName;
        location.MunicipalityName = municipalityName;
        location.LocationType = "MUNICIPALITY";
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureLocalAllySeedAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        var admin = await db.Users.FirstAsync(item => item.Email == "aliado-admin@pnmc.local", cancellationToken);
        var editor = await db.Users.FirstAsync(item => item.Email == "aliado-editor@pnmc.local", cancellationToken);
        var reader = await db.Users.FirstAsync(item => item.Email == "aliado-lector@pnmc.local", cancellationToken);

        var entity = await db.AllyEntities.FirstOrDefaultAsync(item => item.Name == "Entidad Aliada Demo PNMC", cancellationToken);
        if (entity is null)
        {
            entity = new AllyEntityRow
            {
                Name = "Entidad Aliada Demo PNMC",
                EntityType = "red",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                InstitutionalEmail = "entidad.aliada@pnmc.local",
                InstitutionalPhone = "3000000000",
                Status = "activa",
                CreatedByUserId = admin.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.AllyEntities.Add(entity);
            await db.SaveChangesAsync(cancellationToken);
        }

        await EnsureAllyUserLinkAsync(db, admin.Id, entity.Id, "aliado_admin", admin.Id, cancellationToken);
        await EnsureAllyUserLinkAsync(db, editor.Id, entity.Id, "aliado_editor", admin.Id, cancellationToken);
        await EnsureAllyUserLinkAsync(db, reader.Id, entity.Id, "aliado_lector", admin.Id, cancellationToken);
    }

    private static async Task EnsureAllyUserLinkAsync(
        PnmcDbContext db,
        int userId,
        int allyEntityId,
        string role,
        int adminId,
        CancellationToken cancellationToken)
    {
        var link = await db.AllyUserLinks.FirstOrDefaultAsync(
            item => item.UserId == userId && item.AllyEntityId == allyEntityId,
            cancellationToken);
        if (link is null)
        {
            db.AllyUserLinks.Add(new AllyUserLinkRow
            {
                UserId = userId,
                AllyEntityId = allyEntityId,
                AllyRole = role,
                AllyAdminId = adminId,
                Status = "activo",
                IsActive = true,
                LinkedAt = DateTime.UtcNow,
                CreatedByUserId = adminId
            });
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        link.AllyRole = role;
        link.AllyAdminId = adminId;
        link.Status = "activo";
        link.IsActive = true;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureLocalEcosystemSeedAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        if (await db.FestivalRecords.AnyAsync(cancellationToken))
        {
            return;
        }

        var webmaster = await db.Users.FirstAsync(item => item.Email == "admin@pnmc.local", cancellationToken);
        var published = await db.ContentStatuses.FirstAsync(item => item.Code == "publicado", cancellationToken);
        var now = DateTime.UtcNow;

        db.FestivalRecords.Add(new FestivalRow
        {
            Name = "Festival Demo PNMC",
            Description = "Registro local de referencia para validar mapa, revision y publicacion.",
            OrganizerDisplayName = "Entidad Aliada Demo PNMC",
            CoverageLevel = "municipal",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            StatusId = published.Id,
            StatusCode = "publicado",
            CreatedByUserId = webmaster.Id,
            CreatedAt = now,
            PublishedAt = now
        });

        db.SchoolRecords.Add(new SchoolRow
        {
            Name = "Escuela Demo PNMC",
            CoverageLevel = "municipal",
            DepartmentCode = "11",
            MunicipalityCode = "11001",
            StatusId = published.Id,
            StatusCode = "publicado",
            CreatedByUserId = webmaster.Id,
            CreatedAt = now,
            PublishedAt = now,
            IsActiveSchool = true
        });

        db.MarketRecords.Add(new MarketRow
        {
            Name = "Mercado Musical Demo PNMC",
            CoverageLevel = "municipal",
            DepartmentCode = "76",
            MunicipalityCode = "76001",
            StatusId = published.Id,
            StatusCode = "publicado",
            CreatedByUserId = webmaster.Id,
            CreatedAt = now,
            PublishedAt = now
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private static bool LooksLikeAspNetPasswordHash(string passwordHash)
    {
        return !string.IsNullOrWhiteSpace(passwordHash)
            && passwordHash.StartsWith("AQAAAA", StringComparison.Ordinal);
    }

    private static async Task EnsureParticipationSupportTableAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        const string sql = """
            IF OBJECT_ID(N'[Participaciones]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Participaciones] (
                    [Referencia] nvarchar(64) NOT NULL,
                    [FechaEnvio] datetimeoffset NOT NULL,
                    [TipoActor] nvarchar(80) NOT NULL,
                    [NombreActor] nvarchar(240) NOT NULL,
                    [CorreoElectronico] nvarchar(240) NOT NULL,
                    [Departamento] nvarchar(120) NOT NULL,
                    [Municipio] nvarchar(120) NOT NULL,
                    [DatosFormularioJson] nvarchar(max) NOT NULL,
                    CONSTRAINT [PK_Participaciones] PRIMARY KEY ([Referencia])
                );
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Participaciones_FechaEnvio' AND object_id = OBJECT_ID(N'[Participaciones]'))
            BEGIN
                CREATE INDEX [IX_Participaciones_FechaEnvio] ON [Participaciones] ([FechaEnvio]);
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Participaciones_TipoActor' AND object_id = OBJECT_ID(N'[Participaciones]'))
            BEGIN
                CREATE INDEX [IX_Participaciones_TipoActor] ON [Participaciones] ([TipoActor]);
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Participaciones_Departamento' AND object_id = OBJECT_ID(N'[Participaciones]'))
            BEGIN
                CREATE INDEX [IX_Participaciones_Departamento] ON [Participaciones] ([Departamento]);
            END;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }

    private static async Task EnsureEditorialCatalogTableAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        const string sql = """
            IF OBJECT_ID(N'[CatalogoEditorial]', N'U') IS NULL
            BEGIN
                CREATE TABLE [CatalogoEditorial] (
                    [IdRecursoEditorial] int IDENTITY(1,1) NOT NULL,
                    [CodigoRecurso] nvarchar(64) NOT NULL,
                    [Titulo] nvarchar(500) NOT NULL,
                    [Anio] nvarchar(max) NULL,
                    [SeccionPrincipal] nvarchar(max) NULL,
                    [RutaSeccion] nvarchar(max) NULL,
                    [TipoPublicacion] nvarchar(max) NULL,
                    [PracticaMusical] nvarchar(max) NULL,
                    [Categoria] nvarchar(max) NULL,
                    [Subcategoria] nvarchar(max) NULL,
                    [Autor] nvarchar(max) NULL,
                    [AutorCorporativo] nvarchar(max) NULL,
                    [CreditosAdicionales] nvarchar(max) NULL,
                    [ISBN] nvarchar(max) NULL,
                    [ISMN] nvarchar(max) NULL,
                    [TamanoFormato] nvarchar(max) NULL,
                    [Paginas] nvarchar(max) NULL,
                    [Duracion] nvarchar(max) NULL,
                    [AmbitoRegional] nvarchar(max) NULL,
                    [UbicacionPublicacion] nvarchar(max) NULL,
                    [Url] nvarchar(max) NULL,
                    [PalabrasClave] nvarchar(max) NULL,
                    [Resumen] nvarchar(max) NULL,
                    [CamposAdicionales] nvarchar(max) NULL,
                    [DiapositivaOrigen] nvarchar(50) NULL,
                    [ArchivoMiniatura] nvarchar(500) NULL,
                    [TextoPortada] nvarchar(max) NULL,
                    [TextoFuenteCompleto] nvarchar(max) NULL,
                    [OrdenFuente] int NOT NULL CONSTRAINT [DF_CatalogoEditorial_OrdenFuente] DEFAULT (0),
                    [Activo] bit NOT NULL CONSTRAINT [DF_CatalogoEditorial_Activo] DEFAULT (1),
                    [FechaImportacion] datetime2(0) NOT NULL CONSTRAINT [DF_CatalogoEditorial_FechaImportacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_CatalogoEditorial] PRIMARY KEY ([IdRecursoEditorial]),
                    CONSTRAINT [UQ_CatalogoEditorial_CodigoRecurso] UNIQUE ([CodigoRecurso])
                );
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CatalogoEditorial_OrdenFuente' AND object_id = OBJECT_ID(N'[CatalogoEditorial]'))
            BEGIN
                CREATE INDEX [IX_CatalogoEditorial_OrdenFuente] ON [CatalogoEditorial] ([OrdenFuente]);
            END;

            IF OBJECT_ID(N'[CatalogoEditorial]', N'U') IS NOT NULL
            BEGIN
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Anio] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [SeccionPrincipal] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [RutaSeccion] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [TipoPublicacion] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [PracticaMusical] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Categoria] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Subcategoria] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Autor] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [AutorCorporativo] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [ISBN] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [ISMN] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [TamanoFormato] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Paginas] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Duracion] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [AmbitoRegional] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [UbicacionPublicacion] nvarchar(max) NULL;
                ALTER TABLE [CatalogoEditorial] ALTER COLUMN [Url] nvarchar(max) NULL;
            END;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }

    private static async Task EnsureEntityAdministrationTablesAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        const string sql = """
            IF OBJECT_ID(N'[Entidades]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Entidades] (
                    [IdEntidad] int IDENTITY(1,1) NOT NULL,
                    [TipoEntidad] nvarchar(80) NOT NULL,
                    [Nombre] nvarchar(240) NOT NULL,
                    [NombreLegal] nvarchar(240) NULL,
                    [Descripcion] nvarchar(max) NULL,
                    [CorreoContacto] nvarchar(180) NULL,
                    [TelefonoContacto] nvarchar(80) NULL,
                    [SitioWeb] nvarchar(500) NULL,
                    [Facebook] nvarchar(500) NULL,
                    [Instagram] nvarchar(500) NULL,
                    [OtroEnlace] nvarchar(500) NULL,
                    [NivelCobertura] nvarchar(40) NOT NULL CONSTRAINT [DF_Entidades_NivelCobertura] DEFAULT (N'municipal'),
                    [CodigoDepartamento] char(2) NULL,
                    [CodigoMunicipio] char(5) NULL,
                    [Direccion] nvarchar(300) NULL,
                    [Latitud] decimal(9,6) NULL,
                    [Longitud] decimal(9,6) NULL,
                    [EstadoRegistro] nvarchar(80) NOT NULL CONSTRAINT [DF_Entidades_EstadoRegistro] DEFAULT (N'borrador'),
                    [Activo] bit NOT NULL CONSTRAINT [DF_Entidades_Activo] DEFAULT (1),
                    [IdUsuarioCreador] int NOT NULL,
                    [IdUsuarioResponsable] int NULL,
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_Entidades_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NULL,
                    [FechaRevision] datetime2(0) NULL,
                    [FechaAprobacion] datetime2(0) NULL,
                    [FechaPublicacion] datetime2(0) NULL,
                    CONSTRAINT [PK_Entidades] PRIMARY KEY ([IdEntidad]),
                    CONSTRAINT [FK_Entidades_UsuarioCreador] FOREIGN KEY ([IdUsuarioCreador]) REFERENCES [Usuarios] ([IdUsuario]),
                    CONSTRAINT [FK_Entidades_UsuarioResponsable] FOREIGN KEY ([IdUsuarioResponsable]) REFERENCES [Usuarios] ([IdUsuario])
                );
            END;

            IF OBJECT_ID(N'[UsuariosEntidades]', N'U') IS NULL
            BEGIN
                CREATE TABLE [UsuariosEntidades] (
                    [IdUsuarioEntidad] int IDENTITY(1,1) NOT NULL,
                    [IdUsuario] int NOT NULL,
                    [IdEntidad] int NOT NULL,
                    [RolEntidad] nvarchar(80) NOT NULL,
                    [Activo] bit NOT NULL CONSTRAINT [DF_UsuariosEntidades_Activo] DEFAULT (1),
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_UsuariosEntidades_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_UsuariosEntidades] PRIMARY KEY ([IdUsuarioEntidad]),
                    CONSTRAINT [FK_UsuariosEntidades_Usuarios] FOREIGN KEY ([IdUsuario]) REFERENCES [Usuarios] ([IdUsuario]),
                    CONSTRAINT [FK_UsuariosEntidades_Entidades] FOREIGN KEY ([IdEntidad]) REFERENCES [Entidades] ([IdEntidad])
                );
            END;

            IF OBJECT_ID(N'[EntidadesRelaciones]', N'U') IS NULL
            BEGIN
                CREATE TABLE [EntidadesRelaciones] (
                    [IdEntidadRelacion] int IDENTITY(1,1) NOT NULL,
                    [IdEntidadOrigen] int NOT NULL,
                    [IdEntidadDestino] int NOT NULL,
                    [TipoRelacion] nvarchar(80) NOT NULL,
                    [Notas] nvarchar(800) NULL,
                    [Activo] bit NOT NULL CONSTRAINT [DF_EntidadesRelaciones_Activo] DEFAULT (1),
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_EntidadesRelaciones_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_EntidadesRelaciones] PRIMARY KEY ([IdEntidadRelacion]),
                    CONSTRAINT [FK_EntidadesRelaciones_Origen] FOREIGN KEY ([IdEntidadOrigen]) REFERENCES [Entidades] ([IdEntidad]),
                    CONSTRAINT [FK_EntidadesRelaciones_Destino] FOREIGN KEY ([IdEntidadDestino]) REFERENCES [Entidades] ([IdEntidad])
                );
            END;

            IF OBJECT_ID(N'[EntidadesRegistrosFuente]', N'U') IS NULL
            BEGIN
                CREATE TABLE [EntidadesRegistrosFuente] (
                    [IdEntidadRegistroFuente] int IDENTITY(1,1) NOT NULL,
                    [IdEntidad] int NOT NULL,
                    [TablaFuente] nvarchar(120) NOT NULL,
                    [IdRegistroFuente] int NOT NULL,
                    [IdRegistroEcosistema] int NULL,
                    [EsPrincipal] bit NOT NULL CONSTRAINT [DF_EntidadesRegistrosFuente_EsPrincipal] DEFAULT (1),
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_EntidadesRegistrosFuente_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_EntidadesRegistrosFuente] PRIMARY KEY ([IdEntidadRegistroFuente]),
                    CONSTRAINT [FK_EntidadesRegistrosFuente_Entidades] FOREIGN KEY ([IdEntidad]) REFERENCES [Entidades] ([IdEntidad])
                );
            END;

            IF OBJECT_ID(N'[EntidadesHistorialRevision]', N'U') IS NULL
            BEGIN
                CREATE TABLE [EntidadesHistorialRevision] (
                    [IdHistorialRevision] int IDENTITY(1,1) NOT NULL,
                    [IdEntidad] int NOT NULL,
                    [IdUsuario] int NOT NULL,
                    [Accion] nvarchar(80) NOT NULL,
                    [Comentario] nvarchar(1200) NULL,
                    [FechaAccion] datetime2(0) NOT NULL CONSTRAINT [DF_EntidadesHistorialRevision_Fecha] DEFAULT (SYSUTCDATETIME()),
                    CONSTRAINT [PK_EntidadesHistorialRevision] PRIMARY KEY ([IdHistorialRevision]),
                    CONSTRAINT [FK_EntidadesHistorialRevision_Entidades] FOREIGN KEY ([IdEntidad]) REFERENCES [Entidades] ([IdEntidad]),
                    CONSTRAINT [FK_EntidadesHistorialRevision_Usuarios] FOREIGN KEY ([IdUsuario]) REFERENCES [Usuarios] ([IdUsuario])
                );
            END;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
