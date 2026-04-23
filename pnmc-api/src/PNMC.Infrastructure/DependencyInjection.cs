using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PNMC.Infrastructure.Data;
using PNMC.Infrastructure.Integrations.Participation;

namespace PNMC.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPnmcInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));

        if (environment.IsEnvironment("Test"))
        {
            var tempDbPath = Path.Combine(Path.GetTempPath(), $"pnmc-api-tests-{Guid.NewGuid():N}.db");
            services.AddDbContext<PnmcDbContext>(options =>
                options.UseSqlite($"Data Source={tempDbPath}"));
        }
        else
        {
            var sqlServerConnectionString = DatabaseConnectionResolver.ResolveSqlServerConnectionString(configuration);
            if (string.IsNullOrWhiteSpace(sqlServerConnectionString))
            {
                throw new InvalidOperationException(
                    "A SQL Server connection string is required. Use ConnectionStrings:SqlServer or AZURE_SQL_* environment variables.");
            }

            services.AddDbContext<PnmcDbContext>(options =>
                options.UseSqlServer(sqlServerConnectionString, sql => sql.EnableRetryOnFailure(5)));
        }

        services.AddScoped<IParticipationSubmissionStore, DbParticipationSubmissionStore>();

        return services;
    }
}
