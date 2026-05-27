using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PNMC.Api.Endpoints;
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
            db.Database.ExecuteSqlRaw("""
                CREATE TABLE IF NOT EXISTS RegistrosRevisionHistorial (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ModuloId TEXT NOT NULL,
                    RegistroId TEXT NOT NULL,
                    EstadoAnterior TEXT NOT NULL,
                    EstadoNuevo TEXT NOT NULL,
                    Accion TEXT NOT NULL,
                    Comentario TEXT NULL,
                    MotivoRechazo TEXT NULL,
                    CamposObservados TEXT NULL,
                    IdUsuario INTEGER NOT NULL,
                    Fecha TEXT NOT NULL
                );
                """);

            db.Roles.Add(new RoleRow
            {
                Id = 1,
                Name = "webmaster"
            });
            db.Roles.Add(new RoleRow { Id = 2, Name = "gestor_interno" });
            db.Roles.Add(new RoleRow { Id = 3, Name = "aliado_admin" });
            db.Roles.Add(new RoleRow { Id = 4, Name = "aliado_editor" });
            db.Roles.Add(new RoleRow { Id = 5, Name = "aliado_lector" });
            db.Roles.Add(new RoleRow { Id = 6, Name = "externo" });

            var webmasterUser = new UserRow
            {
                Id = 1,
                FullName = "Usuario Prueba",
                Email = "test@pnmc.local",
                RoleId = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            webmasterUser.PasswordHash = AdminAuthEndpoints.HashPassword(webmasterUser, "pnmc-master");
            db.Users.Add(webmasterUser);

            var allyAdminUser = new UserRow
            {
                Id = 2,
                FullName = "Admin Entidad Aliada",
                Email = "aliado.admin@pnmc.local",
                RoleId = 3,
                AccessChannel = "aliado",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            allyAdminUser.PasswordHash = AdminAuthEndpoints.HashPassword(allyAdminUser, "pnmc-aliado-admin");
            db.Users.Add(allyAdminUser);

            var orphanAllyEditor = new UserRow
            {
                Id = 3,
                FullName = "Aliado Sin Entidad",
                Email = "aliado.sin.entidad@pnmc.local",
                RoleId = 4,
                AccessChannel = "aliado",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            orphanAllyEditor.PasswordHash = AdminAuthEndpoints.HashPassword(orphanAllyEditor, "pnmc-aliado-editor");
            db.Users.Add(orphanAllyEditor);

            db.AllyEntities.Add(new AllyEntityRow
            {
                Id = 1,
                Name = "Entidad Aliada Test",
                EntityType = "red",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                InstitutionalEmail = "entidad.aliada@pnmc.local",
                Status = "activa",
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            db.AllyUserLinks.Add(new AllyUserLinkRow
            {
                Id = 1,
                UserId = 2,
                AllyEntityId = 1,
                AllyRole = "aliado_admin",
                AllyAdminId = 2,
                Status = "activo",
                IsActive = true,
                LinkedAt = DateTime.UtcNow,
                CreatedByUserId = 1
            });

            db.ContentStatuses.Add(new ContentStatusRow
            {
                Id = 1,
                Code = "borrador",
                Name = "Borrador"
            });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 2, Code = "en_revision", Name = "En revision" });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 3, Code = "ajustes_solicitados", Name = "Ajustes solicitados" });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 4, Code = "aprobado", Name = "Aprobado" });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 5, Code = "publicado", Name = "Publicado" });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 6, Code = "rechazado", Name = "Rechazado" });
            db.ContentStatuses.Add(new ContentStatusRow { Id = 7, Code = "archivado", Name = "Archivado" });

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
