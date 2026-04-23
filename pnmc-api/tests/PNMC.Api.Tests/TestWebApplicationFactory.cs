using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Tests;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<PnmcDbContext>>();
            services.RemoveAll<PnmcDbContext>();

            var tempDbPath = Path.Combine(Path.GetTempPath(), $"pnmc-migration-tests-{Guid.NewGuid():N}.db");
            services.AddDbContext<PnmcDbContext>(options =>
                options.UseSqlite($"Data Source={tempDbPath}"));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
            db.Database.EnsureCreated();

            db.Roles.Add(new RoleRow
            {
                Id = 1,
                Name = "Webmaster"
            });

            db.Users.Add(new UserRow
            {
                Id = 1,
                FullName = "Usuario Prueba",
                Email = "test@pnmc.local",
                PasswordHash = "hash",
                RoleId = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            db.ContentStatuses.Add(new ContentStatusRow
            {
                Id = 1,
                Code = "draft",
                Name = "Borrador"
            });

            db.DivipolaLocations.AddRange(
                new DivipolaLocationRow
                {
                    DepartmentCode = "11",
                    DepartmentName = "Bogota D.C.",
                    MunicipalityCode = "11001",
                    MunicipalityName = "Bogota D.C.",
                    LocationType = "MUNICIPALITY"
                },
                new DivipolaLocationRow
                {
                    DepartmentCode = "05",
                    DepartmentName = "Antioquia",
                    MunicipalityCode = "05001",
                    MunicipalityName = "Medellin",
                    LocationType = "MUNICIPALITY"
                });

            db.AgendaEvents.Add(new AgendaEventRow
            {
                Id = 1,
                Title = "Encuentro Territorial",
                Description = "Descripcion agenda",
                StartDate = new DateTime(2026, 4, 15),
                CoverageLevel = "municipal",
                DepartmentCode = "11",
                MunicipalityCode = "11001",
                SpecificLocation = "Bogota",
                OrganizationName = "PNMC",
                StatusId = 1,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });

            db.NewsArticles.Add(new NewsArticleRow
            {
                Id = 1,
                Title = "Noticia de prueba",
                Lead = "Resumen noticia",
                Body = "<p>Contenido</p>",
                SlugPrimary = "noticia-de-prueba",
                PublishedDate = new DateTime(2026, 4, 20),
                StatusId = 1,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });

            db.FestivalRecords.Add(new FestivalRow
            {
                Id = 1,
                Name = "Festival Test",
                CoverageLevel = "municipal",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                StatusId = 1,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });

            db.SchoolRecords.Add(new SchoolRow
            {
                Id = 1,
                Name = "Escuela Test",
                CoverageLevel = "municipal",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                StudentsTotal = 100,
                ActiveGroupsCount = 10,
                IsActiveSchool = true,
                StatusId = 1,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });

            db.MarketRecords.Add(new MarketRow
            {
                Id = 1,
                Name = "Mercado Test",
                CoverageLevel = "municipal",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                Periodicity = "Anual",
                EditionsCount = 7,
                HasCurrentYearEdition = false,
                HasAssociatedFestival = false,
                HasRegisteredResponsibleEntity = false,
                StatusId = 1,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });

            db.SaveChanges();
        });
    }
}
