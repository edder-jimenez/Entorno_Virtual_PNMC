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
                }

                logger.LogInformation("SQL Server connection established and support tables verified.");
                return;
            }

            await db.Database.EnsureCreatedAsync(startupToken);
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
                    [Activo] bit NOT NULL CONSTRAINT [DF_Usuarios_Activo] DEFAULT (1),
                    [FechaCreacion] datetime2(0) NOT NULL CONSTRAINT [DF_Usuarios_FechaCreacion] DEFAULT (SYSUTCDATETIME()),
                    [FechaActualizacion] datetime2(0) NULL,
                    [UltimoAcceso] datetime2(0) NULL,
                    CONSTRAINT [PK_Usuarios] PRIMARY KEY ([IdUsuario]),
                    CONSTRAINT [UQ_Usuarios_CorreoElectronico] UNIQUE ([CorreoElectronico]),
                    CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY ([IdRol]) REFERENCES [Roles] ([IdRol])
                );
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

        await EnsureRoleAsync(db, "webmaster", "Rol tecnico con control general de configuracion, usuarios y mantenimiento.", cancellationToken);
        await EnsureRoleAsync(db, "editor", "Rol editorial para crear, editar, revisar y publicar contenidos.", cancellationToken);
        await EnsureRoleAsync(db, "gestor", "Rol de gestion territorial o funcional para cargar y actualizar informacion operativa.", cancellationToken);
        await EnsureRoleAsync(db, "lider", "Rol interno de liderazgo de componente para revision, aprobacion y seguimiento operativo.", cancellationToken);

        var bootstrapPassword = configuration["Security:BootstrapAdminPassword"]
            ?? configuration["PNMC_ADMIN_BOOTSTRAP_PASSWORD"]
            ?? "PnmcAdmin_2026!";

        await EnsureBootstrapUserAsync(
            db,
            "Administrador PNMC",
            "admin@pnmc.local",
            "webmaster",
            bootstrapPassword,
            cancellationToken);
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
