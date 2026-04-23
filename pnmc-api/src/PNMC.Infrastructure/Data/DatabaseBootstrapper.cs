using Microsoft.EntityFrameworkCore;
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

        if (db.Database.IsSqlServer())
        {
            var canConnect = await db.Database.CanConnectAsync(cancellationToken);
            if (!canConnect)
            {
                throw new InvalidOperationException("No fue posible conectar con SQL Server.");
            }

            if (options.EnsureSupportTables)
            {
                await EnsureParticipationSupportTableAsync(db, cancellationToken);
            }

            logger.LogInformation("SQL Server connection established and support tables verified.");
            return;
        }

        await db.Database.EnsureCreatedAsync(cancellationToken);
        logger.LogInformation("Database initialized with EnsureCreated for non-SQL provider.");
    }

    private static async Task EnsureParticipationSupportTableAsync(PnmcDbContext db, CancellationToken cancellationToken)
    {
        const string sql = """
            IF OBJECT_ID(N'[ParticipationSubmissions]', N'U') IS NULL
            BEGIN
                CREATE TABLE [ParticipationSubmissions] (
                    [Reference] nvarchar(64) NOT NULL,
                    [SubmittedAt] datetimeoffset NOT NULL,
                    [ActorType] nvarchar(80) NOT NULL,
                    [ActorName] nvarchar(240) NOT NULL,
                    [Email] nvarchar(240) NOT NULL,
                    [Department] nvarchar(120) NOT NULL,
                    [Municipality] nvarchar(120) NOT NULL,
                    [PayloadJson] nvarchar(max) NOT NULL,
                    CONSTRAINT [PK_ParticipationSubmissions] PRIMARY KEY ([Reference])
                );
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ParticipationSubmissions_SubmittedAt' AND object_id = OBJECT_ID(N'[ParticipationSubmissions]'))
            BEGIN
                CREATE INDEX [IX_ParticipationSubmissions_SubmittedAt] ON [ParticipationSubmissions] ([SubmittedAt]);
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ParticipationSubmissions_ActorType' AND object_id = OBJECT_ID(N'[ParticipationSubmissions]'))
            BEGIN
                CREATE INDEX [IX_ParticipationSubmissions_ActorType] ON [ParticipationSubmissions] ([ActorType]);
            END;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ParticipationSubmissions_Department' AND object_id = OBJECT_ID(N'[ParticipationSubmissions]'))
            BEGIN
                CREATE INDEX [IX_ParticipationSubmissions_Department] ON [ParticipationSubmissions] ([Department]);
            END;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
