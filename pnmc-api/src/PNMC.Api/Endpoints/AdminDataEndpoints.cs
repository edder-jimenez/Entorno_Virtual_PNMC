using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;
using PNMC.Infrastructure.Common;

namespace PNMC.Api.Endpoints;

public static class AdminDataEndpoints
{
    private sealed record AdminModuleMonitorDto(
        string Id,
        string Label,
        string Area,
        int Total,
        IReadOnlyList<object> Statuses
    );

    public static RouteGroupBuilder MapAdminDataEndpoints(this RouteGroupBuilder group)
    {
        var admin = group.MapGroup("/admin/data").WithTags("admin-data");
        admin.AddEndpointFilter(ValidateAdminAccessAsync);

        admin.MapGet("/schema", () =>
        {
            var schema = new
            {
                agenda = new
                {
                    table = "Agenda",
                    required = new[] { "title", "date", "department" },
                    fields = new[]
                    {
                        "id", "title", "description", "category", "date", "timeLabel", "location",
                        "municipality", "department", "organizer", "imageUrl", "tags"
                    }
                },
                news = new
                {
                    table = "Noticias",
                    required = new[] { "title" },
                    fields = new[] { "id", "date", "category", "title", "summary", "contentHtml", "imageUrl" }
                },
                festivals = new
                {
                    table = "Festivales",
                    required = new[] { "name", "department" },
                    fields = new[] { "id", "name", "department", "municipality", "description" }
                },
                musicSchools = new
                {
                    table = "EscuelasMusica",
                    required = new[] { "name", "department" },
                    fields = new[] { "id", "name", "department", "municipality", "students", "activeGroupsCount" }
                },
                musicMarkets = new
                {
                    table = "MercadosMusicales",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "periodicity",
                        "editionsCount", "associatedFestivalDisplayName", "averageProjects", "averageBuyers"
                    }
                },
                gallery = new
                {
                    table = "AlbumesGaleria",
                    required = new[] { "title" },
                    fields = new[]
                    {
                        "id", "title", "summary", "category", "section", "sectionPath", "publicationType",
                        "author", "corporateAuthor", "year", "url", "keywords"
                    }
                },
                organizations = new
                {
                    table = "RedesDocumentacion",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "organizationType",
                        "territorialScope", "contactEmail", "contactPhone", "websiteUrl"
                    }
                },
                spacesInfrastructure = new
                {
                    table = "Lutieres",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "actorType",
                        "primaryFunction", "maxCapacityApprox", "contactEmail", "contactPhone", "websiteUrl"
                    }
                },
                divipola = new { table = "Divipola" },
                processEntityRelations = new
                {
                    table = "RegistrosEcosistemaTerritoriosSonoros / RegistrosEcosistemaPracticasMusicales",
                    required = new[] { "processType", "processId", "entityType", "entityId", "relationshipType" },
                    fields = new[] { "id", "processType", "processId", "entityType", "entityId", "relationshipType", "notes" }
                },
                processRelations = new
                {
                    table = "RegistrosEcosistema",
                    required = new[] { "sourceProcessType", "sourceProcessId", "targetProcessType", "targetProcessId", "relationshipType" },
                    fields = new[] { "id", "sourceProcessType", "sourceProcessId", "targetProcessType", "targetProcessId", "relationshipType", "notes" }
                },
                participation = new
                {
                    table = "Participaciones",
                    required = new[] { "actorType", "actorName", "email", "department", "municipality", "consent" },
                    fields = new[] { "reference", "submittedAt", "payloadJson" }
                }
            };

            return Results.Ok(schema);
        });

        admin.MapGet("/stats", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var stats = new
            {
                news = await dbContext.NewsArticles.CountAsync(cancellationToken),
                agenda = await dbContext.AgendaEvents.CountAsync(cancellationToken),
                editorial = await dbContext.GalleryAlbums.CountAsync(cancellationToken),
                festivals = await dbContext.FestivalRecords.CountAsync(cancellationToken),
                musicMarkets = await dbContext.MarketRecords.CountAsync(cancellationToken),
                musicSchools = await dbContext.SchoolRecords.CountAsync(cancellationToken),
                organizations = await dbContext.Organizations.CountAsync(cancellationToken),
                spacesInfrastructure = await dbContext.SpacesInfrastructure.CountAsync(cancellationToken),
                divipola = await dbContext.DivipolaLocations.CountAsync(cancellationToken),
                processEntityRelations = await dbContext.ProcessEntityRelations.CountAsync(cancellationToken),
                processRelations = await dbContext.ProcessRelations.CountAsync(cancellationToken),
                participation = await dbContext.Participations.CountAsync(cancellationToken),
                users = await dbContext.Users.CountAsync(cancellationToken),
                statuses = await dbContext.ContentStatuses.CountAsync(cancellationToken)
            };

            return Results.Ok(stats);
        });

        admin.MapGet("/monitor", async (
            PnmcDbContext dbContext,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var startedAt = DateTime.UtcNow;
            var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
            var statuses = await dbContext.ContentStatuses.AsNoTracking()
                .OrderBy(item => item.Id)
                .Select(item => new { code = item.Code, label = item.Name })
                .ToListAsync(cancellationToken);
            var statusNames = statuses.ToDictionary(item => item.code, item => item.label, StringComparer.OrdinalIgnoreCase);

            var modules = new List<AdminModuleMonitorDto>
            {
                await BuildModuleMonitorAsync("agenda", "Agenda", "Comunicaciones y prensa", dbContext.AgendaEvents.AsNoTracking().Select(item => item.StatusId), dbContext, cancellationToken),
                await BuildModuleMonitorAsync("news", "Noticias", "Comunicaciones y prensa", dbContext.NewsArticles.AsNoTracking().Select(item => item.StatusId), dbContext, cancellationToken),
                await BuildModuleMonitorAsync("editorial", "Álbumes y galería", "Comunicaciones y prensa", dbContext.GalleryAlbums.AsNoTracking().Select(item => item.StatusId), dbContext, cancellationToken),
                BuildModuleMonitor("festivals", "Festivales", "Mapa ecosistémico", await dbContext.FestivalRecords.AsNoTracking().Select(item => item.StatusCode).ToListAsync(cancellationToken), statusNames),
                BuildModuleMonitor("musicSchools", "Escuelas de música", "Mapa ecosistémico", await dbContext.SchoolRecords.AsNoTracking().Select(item => item.StatusCode).ToListAsync(cancellationToken), statusNames),
                BuildModuleMonitor("musicMarkets", "Mercados musicales", "Mapa ecosistémico", await dbContext.MarketRecords.AsNoTracking().Select(item => item.StatusCode).ToListAsync(cancellationToken), statusNames),
                BuildModuleMonitor("organizations", "Redes de documentación", "Mapa ecosistémico", await dbContext.Organizations.AsNoTracking().Select(item => item.StatusCode).ToListAsync(cancellationToken), statusNames),
                BuildModuleMonitor("spacesInfrastructure", "Lutieres", "Mapa ecosistémico", await dbContext.SpacesInfrastructure.AsNoTracking().Select(item => item.StatusCode).ToListAsync(cancellationToken), statusNames)
            };

            var recentAudit = await dbContext.AuditLogs.AsNoTracking()
                .OrderByDescending(item => item.CreatedAt)
                .Take(8)
                .Select(item => new
                {
                    id = item.Id,
                    table = item.TableName,
                    recordId = item.RecordId,
                    action = item.Action,
                    createdAt = item.CreatedAt
                })
                .ToListAsync(cancellationToken);

            var elapsed = DateTime.UtcNow - startedAt;
            return Results.Ok(new
            {
                checkedAt = DateTime.UtcNow,
                environment = environment.EnvironmentName,
                api = new
                {
                    status = "ok",
                    latencyMs = Math.Max(1, (int)elapsed.TotalMilliseconds),
                    serverTimeUtc = DateTime.UtcNow
                },
                database = new
                {
                    status = canConnect ? "ok" : "error",
                    provider = dbContext.Database.ProviderName,
                    canConnect
                },
                web = new
                {
                    status = "client-loaded",
                    note = "El estado del frontend se verifica desde el navegador; la API confirma backend y base de datos."
                },
                totals = new
                {
                    records = modules.Sum(item => item.Total),
                    modules = modules.Count,
                    users = await dbContext.Users.CountAsync(cancellationToken),
                    territories = await dbContext.DivipolaLocations.CountAsync(cancellationToken),
                    entities = await dbContext.EntityProfiles.CountAsync(item => item.IsActive, cancellationToken)
                },
                modules,
                statuses,
                recentAudit
            });
        });

        admin.MapGet("/records/{moduleId}", async (
            string moduleId,
            PnmcDbContext dbContext,
            string? q,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var take = Math.Clamp(limit ?? 25, 1, 100);
            var skip = Math.Max(offset ?? 0, 0);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);
            var statuses = await dbContext.ContentStatuses.AsNoTracking().ToListAsync(cancellationToken);
            var statusLabelsById = statuses.ToDictionary(item => item.Id, item => item.Name);
            var statusCodesById = statuses.ToDictionary(item => item.Id, item => item.Code);
            var statusLabelsByCode = statuses.ToDictionary(item => item.Code, item => item.Name, StringComparer.OrdinalIgnoreCase);
            var normalizedQuery = NormalizeText(q ?? string.Empty);
            var categories = await dbContext.Categories.AsNoTracking().ToListAsync(cancellationToken);
            var categoriesById = categories.ToDictionary(item => item.Id, item => item.Name);

            bool Matches(params string?[] values)
            {
                if (string.IsNullOrWhiteSpace(normalizedQuery)) return true;
                return values.Any(value => NormalizeText(value ?? string.Empty).Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase));
            }

            var records = moduleId switch
            {
                "agenda" => (await dbContext.AgendaEvents.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .ThenByDescending(item => item.StartDate)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Title, item.OrganizationName, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Title,
                        "Agenda",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        statusCodesById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        statusLabelsById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["title"] = item.Title,
                            ["shortDescription"] = item.ShortDescription,
                            ["description"] = item.Description,
                            ["category"] = item.CategoryId.HasValue ? categoriesById.GetValueOrDefault(item.CategoryId.Value, string.Empty) : string.Empty,
                            ["date"] = item.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["endDate"] = item.EndDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["timeLabel"] = item.StartTime?.ToString(@"hh\:mm"),
                            ["endTimeLabel"] = item.EndTime?.ToString(@"hh\:mm"),
                            ["location"] = item.SpecificLocation,
                            ["organizer"] = item.OrganizationName,
                            ["imageUrl"] = item.MoreInfoUrl,
                            ["festivalId"] = item.FestivalId,
                            ["sortOrder"] = item.SortOrder
                        })),
                "news" => (await dbContext.NewsArticles.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.PublishedDate ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Title, item.AuthorName, item.Lead))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Title,
                        "Noticias",
                        string.Empty,
                        string.Empty,
                        statusCodesById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        statusLabelsById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        item.UpdatedAt ?? item.PublishedDate ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["title"] = item.Title,
                            ["slug"] = item.SlugPrimary,
                            ["summary"] = item.Lead,
                            ["contentHtml"] = item.Body,
                            ["quoteText"] = item.QuoteText,
                            ["author"] = item.AuthorName,
                            ["category"] = item.CategoryId.HasValue ? categoriesById.GetValueOrDefault(item.CategoryId.Value, string.Empty) : string.Empty,
                            ["date"] = item.PublishedDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["imageUrl"] = item.PrimaryExternalUrl,
                            ["embedUrl"] = item.PrimaryEmbedUrl,
                            ["sortOrder"] = item.SortOrder
                        })),
                "festivals" => (await dbContext.FestivalRecords.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Name, item.OrganizerDisplayName, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Name,
                        "Festivales",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        item.StatusCode,
                        statusLabelsByCode.GetValueOrDefault(item.StatusCode, item.StatusCode),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["name"] = item.Name,
                            ["versionsCount"] = item.VersionsCount,
                            ["lastEditionDate"] = item.LastEditionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["description"] = item.Description,
                            ["organizer"] = item.OrganizerDisplayName,
                            ["organizerEmail"] = item.OrganizerContactEmail,
                            ["organizerPhone"] = item.OrganizerContactPhone,
                            ["organizerWebsiteUrl"] = item.OrganizerWebsiteUrl,
                            ["contactEmail"] = item.ContactEmail,
                            ["contactPhone"] = item.ContactPhone,
                            ["websiteUrl"] = item.WebsiteUrl,
                            ["instagramUrl"] = item.InstagramUrl,
                            ["facebookUrl"] = item.FacebookUrl,
                            ["otherUrl"] = item.OtherUrl,
                            ["hasCurrentYearEdition"] = item.HasCurrentYearEdition,
                            ["currentYearEditionStatus"] = item.CurrentYearEditionStatus,
                            ["currentYearStartDate"] = item.CurrentYearStartDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["currentYearEndDate"] = item.CurrentYearEndDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["coverageLevel"] = item.CoverageLevel,
                            ["coverageLevelLabel"] = DisplayCoverageLevel(item.CoverageLevel)
                        })),
                "musicSchools" => (await dbContext.SchoolRecords.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Name, item.ResponsibleEntityDisplayName, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Name,
                        "EscuelasMusica",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        item.StatusCode,
                        statusLabelsByCode.GetValueOrDefault(item.StatusCode, item.StatusCode),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["name"] = item.Name,
                            ["schoolCategory"] = item.SchoolCategory,
                            ["schoolType"] = item.SchoolType,
                            ["responsibleEntity"] = item.ResponsibleEntityDisplayName,
                            ["directorName"] = item.DirectorName,
                            ["contactEmail"] = item.ContactEmail,
                            ["contactPhone"] = item.ContactPhone,
                            ["websiteUrl"] = item.WebsiteUrl,
                            ["instagramUrl"] = item.InstagramUrl,
                            ["facebookUrl"] = item.FacebookUrl,
                            ["otherUrl"] = item.OtherUrl,
                            ["coverageLevel"] = item.CoverageLevel,
                            ["coverageLevelLabel"] = DisplayCoverageLevel(item.CoverageLevel),
                            ["specificLocation"] = item.SpecificLocation,
                            ["addressText"] = item.AddressText,
                            ["latitude"] = item.Latitude,
                            ["longitude"] = item.Longitude,
                            ["trainingCapacity"] = item.StudentsAgeTotal,
                            ["students"] = item.StudentsTotal,
                            ["activeGroupsCount"] = item.ActiveGroupsCount,
                            ["trainingProcesses"] = item.TrainingProcesses,
                            ["musicalPractices"] = item.MusicalPractices,
                            ["isActiveSchool"] = item.IsActiveSchool,
                            ["observations"] = item.Observations
                        })),
                "musicMarkets" => (await dbContext.MarketRecords.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Name, item.ResponsibleEntityDisplayName, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Name,
                        "MercadosMusicales",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        item.StatusCode,
                        statusLabelsByCode.GetValueOrDefault(item.StatusCode, item.StatusCode),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["name"] = item.Name,
                            ["editionsCount"] = item.EditionsCount,
                            ["periodicity"] = item.Periodicity,
                            ["description"] = item.Description,
                            ["hasCurrentYearEdition"] = item.HasCurrentYearEdition,
                            ["currentYearEditionStatus"] = item.CurrentYearEditionStatus,
                            ["currentYearStartDate"] = item.CurrentYearStartDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["currentYearEndDate"] = item.CurrentYearEndDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            ["responsibleEntity"] = item.ResponsibleEntityDisplayName,
                            ["responsibleEntityEmail"] = item.ResponsibleEntityContactEmail,
                            ["responsibleEntityPhone"] = item.ResponsibleEntityContactPhone,
                            ["responsibleEntityWebsiteUrl"] = item.ResponsibleEntityWebsiteUrl,
                            ["associatedFestivalId"] = item.AssociatedFestivalId,
                            ["associatedFestivalDisplayName"] = item.AssociatedFestivalDisplayName,
                            ["scopeType"] = item.ScopeType,
                            ["marketMode"] = item.MarketMode,
                            ["coverageLevel"] = item.CoverageLevel,
                            ["coverageLevelLabel"] = DisplayCoverageLevel(item.CoverageLevel),
                            ["specificLocation"] = item.SpecificLocation
                        })),
                "organizations" => (await dbContext.Organizations.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Name, item.ContactEmail, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Name,
                        "RedesDocumentacion",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        item.StatusCode,
                        statusLabelsByCode.GetValueOrDefault(item.StatusCode, item.StatusCode),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["name"] = item.Name,
                            ["organizationType"] = item.OrganizationType,
                            ["coverageLevel"] = item.CoverageLevel,
                            ["coverageLevelLabel"] = DisplayCoverageLevel(item.CoverageLevel),
                            ["territorialScope"] = item.TerritorialScope,
                            ["latitude"] = item.Latitude,
                            ["longitude"] = item.Longitude,
                            ["description"] = item.Description,
                            ["contactEmail"] = item.ContactEmail,
                            ["websiteUrl"] = item.WebsiteUrl,
                            ["facebookUrl"] = item.FacebookUrl,
                            ["instagramUrl"] = item.InstagramUrl,
                            ["otherUrl"] = item.OtherUrl
                        })),
                "spacesInfrastructure" => (await dbContext.SpacesInfrastructure.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Name, item.ContactEmail, ResolveDepartmentName(item.DepartmentCode, departments), ResolveMunicipalityName(item.MunicipalityCode, municipalities)))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Name,
                        "Lutieres",
                        ResolveDepartmentName(item.DepartmentCode, departments),
                        ResolveMunicipalityName(item.MunicipalityCode, municipalities),
                        item.StatusCode,
                        statusLabelsByCode.GetValueOrDefault(item.StatusCode, item.StatusCode),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["name"] = item.ResponsibleEntityDisplayName,
                            ["actorType"] = item.ActorType,
                            ["workshopName"] = item.Name,
                            ["primaryFunction"] = item.PrimaryFunction,
                            ["instruments"] = item.SecondaryFunctions,
                            ["description"] = item.MainUses,
                            ["contactName"] = item.ContactPersonName,
                            ["contactEmail"] = item.ContactEmail,
                            ["contactPhone"] = item.ContactPhone,
                            ["websiteUrl"] = item.WebsiteUrl,
                            ["facebookUrl"] = item.FacebookUrl,
                            ["instagramUrl"] = item.InstagramUrl,
                            ["otherUrl"] = item.OtherUrl,
                            ["addressText"] = item.AddressText,
                            ["zone"] = item.SpecificLocation,
                            ["latitude"] = item.Latitude,
                            ["longitude"] = item.Longitude,
                            ["coverageLevel"] = item.CoverageLevel,
                            ["coverageLevelLabel"] = DisplayCoverageLevel(item.CoverageLevel)
                        })),
                "gallery" => (await dbContext.GalleryAlbums.AsNoTracking()
                    .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Title, item.Description))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Title,
                        "AlbumesGaleria",
                        string.Empty,
                        string.Empty,
                        statusCodesById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        statusLabelsById.GetValueOrDefault(item.StatusId, item.StatusId.ToString(CultureInfo.InvariantCulture)),
                        item.UpdatedAt ?? item.CreatedAt,
                        new Dictionary<string, object?>
                        {
                            ["title"] = item.Title,
                            ["summary"] = item.Description,
                            ["category"] = item.CategoryId.HasValue ? categoriesById.GetValueOrDefault(item.CategoryId.Value, string.Empty) : string.Empty,
                            ["sortOrder"] = item.SortOrder
                        })),
                "editorial" => (await dbContext.EditorialCatalogResources.AsNoTracking()
                    .OrderBy(item => item.SourceOrder)
                    .ThenByDescending(item => item.ImportedAt)
                    .Take(500)
                    .ToListAsync(cancellationToken))
                    .Where(item => Matches(item.Title, item.Author, item.CorporateAuthor, item.Category, item.Summary, item.Keywords))
                    .Select(item => ToAdminRecord(
                        item.Id,
                        item.Title,
                        "CatalogoEditorial",
                        string.Empty,
                        string.Empty,
                        item.IsActive ? "publicado" : "archivado",
                        item.IsActive ? "Publicado" : "Archivado",
                        item.ImportedAt,
                        new Dictionary<string, object?>
                        {
                            ["title"] = item.Title,
                            ["summary"] = item.Summary,
                            ["year"] = item.Year,
                            ["section"] = item.Section,
                            ["sectionPath"] = item.SectionPath,
                            ["publicationType"] = item.PublicationType,
                            ["category"] = item.Category,
                            ["author"] = item.Author,
                            ["corporateAuthor"] = item.CorporateAuthor,
                            ["url"] = item.Url,
                            ["keywords"] = SplitKeywords(item.Keywords),
                            ["sortOrder"] = item.SourceOrder
                        })),
                _ => null
            };

            if (records is null)
            {
                return Results.NotFound(new { message = $"Modulo administrativo no reconocido: {moduleId}." });
            }

            var filtered = records.ToList();
            return Results.Ok(ToPage(filtered, take, skip));
        });

        admin.MapPost("/records/{moduleId}/{id:int}/status", async (
            string moduleId,
            int id,
            AdminRecordStatusRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var statusCode = CleanStatusCode(request.Status);
            if (!await dbContext.ContentStatuses.AsNoTracking().AnyAsync(status => status.Code == statusCode, cancellationToken))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["El estado no existe en EstadosContenido."] });
            }

            var role = CleanRoleName(httpContext.User.FindFirstValue(ClaimTypes.Role));
            var previousStatus = await ResolveCurrentRecordStatusAsync(dbContext, moduleId, id, cancellationToken);
            if (previousStatus is null)
            {
                return Results.NotFound(new { message = "Registro no encontrado o modulo no reconocido." });
            }

            if (!CanSetRecordStatus(role, previousStatus, statusCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["permission"] = ["Tu rol no tiene permiso para aplicar ese cambio de estado."]
                });
            }

            var actingUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var statusId = await ResolveStatusIdAsync(dbContext, statusCode, cancellationToken);
            var now = DateTime.UtcNow;
            object? result = moduleId switch
            {
                "agenda" => await UpdateContentStatusAsync(dbContext.AgendaEvents, id, statusId, actingUserId, now, cancellationToken),
                "news" => await UpdateContentStatusAsync(dbContext.NewsArticles, id, statusId, actingUserId, now, cancellationToken),
                "gallery" => await UpdateContentStatusAsync(dbContext.GalleryAlbums, id, statusId, actingUserId, now, cancellationToken),
                "editorial" => await UpdateEditorialCatalogStatusAsync(dbContext.EditorialCatalogResources, id, statusCode, now, cancellationToken),
                "festivals" => await UpdateEcosystemStatusAsync(dbContext.FestivalRecords, id, statusCode, now, cancellationToken),
                "musicSchools" => await UpdateEcosystemStatusAsync(dbContext.SchoolRecords, id, statusCode, now, cancellationToken),
                "musicMarkets" => await UpdateEcosystemStatusAsync(dbContext.MarketRecords, id, statusCode, now, cancellationToken),
                "organizations" => await UpdateEcosystemStatusAsync(dbContext.Organizations, id, statusCode, now, cancellationToken),
                "spacesInfrastructure" => await UpdateEcosystemStatusAsync(dbContext.SpacesInfrastructure, id, statusCode, now, cancellationToken),
                _ => null
            };

            await dbContext.SaveChangesAsync(cancellationToken);
            await WriteRevisionHistoryAsync(
                dbContext,
                moduleId,
                id.ToString(CultureInfo.InvariantCulture),
                previousStatus,
                statusCode,
                ActionForStatus(statusCode),
                actingUserId,
                request.Comment,
                request.RejectionReason,
                request.ObservedFieldsJson,
                cancellationToken);

            return Results.Ok(result);
        });

        admin.MapPost("/agenda/events", async (
            AgendaEventUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveStatusIdAsync(dbContext, request.Status, cancellationToken);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var categoryId = await ResolveCategoryIdAsync(dbContext, "agenda", request.Category, cancellationToken);
            var eventDate = ParseDateOrDefault(request.Date, DateTime.UtcNow.Date);
            var existing = await FindAgendaEventAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new AgendaEventRow();

            row.Title = request.Title.Trim();
            row.Description = request.Description?.Trim();
            row.ShortDescription = string.IsNullOrWhiteSpace(request.ShortDescription) ? request.Description?.Trim() : request.ShortDescription.Trim();
            row.CategoryId = categoryId;
            row.StartDate = eventDate;
            row.EndDate = ParseDateOrNull(request.EndDate);
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.SpecificLocation = request.Location?.Trim();
            row.OrganizationName = request.Organizer?.Trim();
            row.MoreInfoUrl = request.ImageUrl?.Trim();
            row.StartTime = ParseTimeOrNull(request.TimeLabel);
            row.EndTime = ParseTimeOrNull(request.EndTimeLabel);
            row.FestivalId = ParseIntOrNull(request.FestivalId);
            row.SortOrder = ParseIntOrNull(request.SortOrder);
            row.StatusId = defaultStatusId;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.AgendaEvents.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/news/articles", async (
            NewsArticleUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveStatusIdAsync(dbContext, request.Status, cancellationToken);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var categoryId = await ResolveCategoryIdAsync(dbContext, "news", request.Category, cancellationToken);
            var publishedDate = ParseDateOrNull(request.Date);

            var existing = await FindNewsArticleAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new NewsArticleRow();

            row.Title = request.Title.Trim();
            row.Lead = request.Summary?.Trim();
            row.Body = string.IsNullOrWhiteSpace(request.ContentHtml)
                ? request.Summary?.Trim() ?? string.Empty
                : HtmlSanitizer.SanitizeRichHtml(request.ContentHtml);
            row.QuoteText = request.QuoteText?.Trim();
            row.AuthorName = request.Author?.Trim();
            row.CategoryId = categoryId;
            row.PublishedDate = publishedDate;
            row.UpdatedDate = DateTime.UtcNow.Date;
            row.PrimaryExternalUrl = request.ImageUrl?.Trim();
            row.PrimaryEmbedUrl = request.EmbedUrl?.Trim();
            row.SlugPrimary = string.IsNullOrWhiteSpace(request.Slug) ? BuildSlug(request.Title) : BuildSlug(request.Slug);
            row.SortOrder = ParseIntOrNull(request.SortOrder);
            row.StatusId = defaultStatusId;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.NewsArticles.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/map/festivals", async (
            MapFestivalUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var statusCode = CleanStatusCode(request.Status);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var existing = await FindFestivalAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new FestivalRow();

            row.Name = request.Name.Trim();
            row.VersionsCount = ParseIntOrNull(request.VersionsCount);
            row.LastEditionDate = ParseDateOrNull(request.LastEditionDate);
            row.Description = request.Description?.Trim();
            row.OrganizerDisplayName = request.Organizer?.Trim();
            row.OrganizerContactEmail = request.OrganizerEmail?.Trim();
            row.OrganizerContactPhone = request.OrganizerPhone?.Trim();
            row.OrganizerWebsiteUrl = request.OrganizerWebsiteUrl?.Trim();
            row.ContactEmail = request.ContactEmail?.Trim();
            row.InstagramUrl = request.InstagramUrl?.Trim();
            row.FacebookUrl = request.FacebookUrl?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.OtherUrl = request.OtherUrl?.Trim();
            row.ContactPhone = request.ContactPhone?.Trim();
            row.HasCurrentYearEdition = request.HasCurrentYearEdition;
            row.CurrentYearEditionStatus = request.CurrentYearEditionStatus?.Trim();
            row.CurrentYearStartDate = ParseDateOrNull(request.CurrentYearStartDate);
            row.CurrentYearEndDate = ParseDateOrNull(request.CurrentYearEndDate);
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.StatusCode = statusCode;
            row.HasRegisteredOrganizer = false;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.FestivalRecords.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/map/schools", async (
            MapSchoolUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var statusCode = CleanStatusCode(request.Status);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var existing = await FindSchoolAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new SchoolRow();

            row.Name = request.Name.Trim();
            row.SchoolCategory = request.SchoolCategory?.Trim();
            row.SchoolType = request.SchoolType?.Trim();
            row.ResponsibleEntityDisplayName = request.ResponsibleEntity?.Trim();
            row.DirectorName = request.DirectorName?.Trim();
            row.ContactEmail = request.ContactEmail?.Trim();
            row.ContactPhone = request.ContactPhone?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.InstagramUrl = request.InstagramUrl?.Trim();
            row.FacebookUrl = request.FacebookUrl?.Trim();
            row.OtherUrl = request.OtherUrl?.Trim();
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.SpecificLocation = request.SpecificLocation?.Trim();
            row.AddressText = request.AddressText?.Trim();
            row.Latitude = request.Latitude;
            row.Longitude = request.Longitude;
            row.StudentsAgeTotal = ParseIntOrNull(request.TrainingCapacity);
            row.StudentsTotal = Math.Max(0, request.Students);
            row.ActiveGroupsCount = Math.Max(0, request.ActiveGroupsCount);
            row.TrainingProcesses = request.TrainingProcesses?.Trim();
            row.MusicalPractices = request.MusicalPractices?.Trim();
            row.IsActiveSchool = request.IsActiveSchool;
            row.Observations = request.Observations?.Trim();
            row.StatusCode = statusCode;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.SchoolRecords.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/map/markets", async (
            MapMarketUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var statusCode = CleanStatusCode(request.Status);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var existing = await FindMarketAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new MarketRow();

            row.Name = request.Name.Trim();
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.Periodicity = request.Periodicity?.Trim();
            row.EditionsCount = request.EditionsCount > 0 ? request.EditionsCount : row.EditionsCount;
            row.Description = request.Description?.Trim();
            row.HasCurrentYearEdition = request.HasCurrentYearEdition;
            row.CurrentYearEditionStatus = request.CurrentYearEditionStatus?.Trim();
            row.CurrentYearStartDate = ParseDateOrNull(request.CurrentYearStartDate);
            row.CurrentYearEndDate = ParseDateOrNull(request.CurrentYearEndDate);
            row.ResponsibleEntityDisplayName = request.ResponsibleEntity?.Trim();
            row.ResponsibleEntityContactEmail = request.ResponsibleEntityEmail?.Trim();
            row.ResponsibleEntityContactPhone = request.ResponsibleEntityPhone?.Trim();
            row.ResponsibleEntityWebsiteUrl = request.ResponsibleEntityWebsiteUrl?.Trim();
            row.AssociatedFestivalId = ParseIntOrNull(request.AssociatedFestivalId);
            row.AssociatedFestivalDisplayName = request.AssociatedFestivalDisplayName?.Trim();
            row.HasAssociatedFestival = !ValidationHelpers.IsMissing(row.AssociatedFestivalDisplayName);
            row.ScopeType = request.ScopeType?.Trim();
            row.MarketMode = request.MarketMode?.Trim();
            row.SpecificLocation = request.SpecificLocation?.Trim();
            row.HasRegisteredResponsibleEntity = false;
            row.StatusCode = statusCode;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.MarketRecords.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/gallery/albums", async (
            EditorialResourceUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveStatusIdAsync(dbContext, request.Status, cancellationToken);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var categoryId = await ResolveCategoryIdAsync(dbContext, "editorial", request.Category, cancellationToken);

            var existing = await FindGalleryAlbumAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new GalleryAlbumRow();

            row.Title = request.Title.Trim();
            row.Description = request.Summary?.Trim();
            row.CategoryId = categoryId;
            row.StatusId = defaultStatusId;
            row.SortOrder = ParseIntOrNull(request.SortOrder) ?? (row.SortOrder > 0
                ? row.SortOrder
                : await ResolveNextGalleryAlbumSortOrderAsync(dbContext, cancellationToken));

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                row.PublishedAt = DateTime.UtcNow;
                dbContext.GalleryAlbums.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/editorial/resources", async (
            EditorialResourceUpsertRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["El titulo es obligatorio."] });
            }

            var existing = await FindEditorialCatalogResourceAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new EditorialCatalogResourceRow
            {
                ExternalId = $"admin-{Guid.NewGuid():N}",
                ImportedAt = DateTime.UtcNow,
                IsActive = true
            };

            row.Title = request.Title.Trim();
            row.Summary = request.Summary?.Trim() ?? string.Empty;
            row.Category = request.Category?.Trim() ?? string.Empty;
            row.Section = request.Section?.Trim() ?? string.Empty;
            row.SectionPath = request.SectionPath?.Trim() ?? string.Empty;
            row.PublicationType = request.PublicationType?.Trim() ?? string.Empty;
            row.Author = request.Author?.Trim() ?? string.Empty;
            row.CorporateAuthor = request.CorporateAuthor?.Trim() ?? string.Empty;
            row.Year = request.Year?.Trim() ?? string.Empty;
            row.Url = request.Url?.Trim() ?? string.Empty;
            row.Keywords = string.Join(", ", (request.Keywords ?? []).Select(item => item.Trim()).Where(item => !string.IsNullOrWhiteSpace(item)));
            row.SourceOrder = ParseIntOrNull(request.SortOrder) ?? row.SourceOrder;
            row.IsActive = CleanStatusCode(request.Status) != "archivado";

            if (isNew)
            {
                dbContext.EditorialCatalogResources.Add(row);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/organizations", async (
            OrganizationUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var statusCode = CleanStatusCode(request.Status);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var existing = await FindOrganizationAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new OrganizationRow();

            row.Name = request.Name.Trim();
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.OrganizationType = request.OrganizationType?.Trim();
            row.TerritorialScope = request.TerritorialScope?.Trim();
            row.Latitude = request.Latitude;
            row.Longitude = request.Longitude;
            row.Description = request.Description?.Trim();
            row.ContactEmail = request.ContactEmail?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.FacebookUrl = request.FacebookUrl?.Trim();
            row.InstagramUrl = request.InstagramUrl?.Trim();
            row.OtherUrl = request.OtherUrl?.Trim();
            row.StatusCode = statusCode;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.Organizations.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/spaces-infrastructure", async (
            SpaceInfrastructureUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var statusCode = CleanStatusCode(request.Status);
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var existing = await FindSpaceInfrastructureAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new SpaceInfrastructureRow();

            row.Name = request.Name.Trim();
            row.ResponsibleEntityDisplayName = request.Name.Trim();
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = ResolveCoverageLevel(request.CoverageLevel, municipalityCode, departmentCode);
            row.ActorType = request.ActorType?.Trim();
            row.Name = string.IsNullOrWhiteSpace(request.WorkshopName) ? request.Name.Trim() : request.WorkshopName.Trim();
            row.PrimaryFunction = request.PrimaryFunction?.Trim();
            row.SecondaryFunctions = request.Instruments?.Trim();
            row.MainUses = request.Description?.Trim();
            row.ContactPersonName = request.ContactName?.Trim();
            row.ContactEmail = request.ContactEmail?.Trim();
            row.ContactPhone = request.ContactPhone?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.FacebookUrl = request.FacebookUrl?.Trim();
            row.InstagramUrl = request.InstagramUrl?.Trim();
            row.OtherUrl = request.OtherUrl?.Trim();
            row.AddressText = request.AddressText?.Trim();
            row.SpecificLocation = request.Zone?.Trim();
            row.Latitude = request.Latitude;
            row.Longitude = request.Longitude;
            row.StatusCode = statusCode;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.SpacesInfrastructure.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/process-entity-relations", async (
            ProcessEntityRelationUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.ProcessType)
                || request.ProcessId <= 0
                || ValidationHelpers.IsMissing(request.EntityType)
                || request.EntityId <= 0
                || ValidationHelpers.IsMissing(request.RelationshipType))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["process"] = ["ProcessType, ProcessId, EntityType, EntityId and RelationshipType are required."]
                });
            }

            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var existing = await FindProcessEntityRelationAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new ProcessEntityRelationRow();

            row.ProcessType = request.ProcessType.Trim();
            row.ProcessId = request.ProcessId;
            row.EntityType = request.EntityType.Trim();
            row.EntityId = request.EntityId;
            row.RelationshipType = request.RelationshipType.Trim();
            row.Notes = request.Notes?.Trim();

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.ProcessEntityRelations.Add(row);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/process-relations", async (
            ProcessRelationUpsertRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.SourceProcessType)
                || request.SourceProcessId <= 0
                || ValidationHelpers.IsMissing(request.TargetProcessType)
                || request.TargetProcessId <= 0
                || ValidationHelpers.IsMissing(request.RelationshipType))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["process"] = ["Source/Target process and RelationshipType are required."]
                });
            }

            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var existing = await FindProcessRelationAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new ProcessRelationRow();

            row.SourceProcessType = request.SourceProcessType.Trim();
            row.SourceProcessId = request.SourceProcessId;
            row.TargetProcessType = request.TargetProcessType.Trim();
            row.TargetProcessId = request.TargetProcessId;
            row.RelationshipType = request.RelationshipType.Trim();
            row.Notes = request.Notes?.Trim();

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.ProcessRelations.Add(row);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/ai/analyze", async (
            AIAnalysisRequest request,
            IConfiguration config,
            CancellationToken cancellationToken) =>
        {
            var apiKey = config["Security:GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return Results.Ok(new
                {
                    success = false,
                    aiAvailable = false,
                    result = "{}",
                    message = "La IA central no está configurada. El frontend usará extracción local básica."
                });
            }

            var attachments = (request.Attachments ?? [])
                .Where(item => !string.IsNullOrWhiteSpace(item.Base64Data) && IsSupportedAiAttachment(item.MimeType))
                .Take(3)
                .ToList();

            if (string.IsNullOrWhiteSpace(request.Text) && attachments.Count == 0)
            {
                return Results.BadRequest(new { message = "Debes enviar texto o al menos un archivo PDF/imagen para analizar." });
            }

            var prompt = "Analiza el siguiente texto libre y extrae toda la información relevante para el módulo de base de datos '" + request.ModuleId + "'.\n" +
                         "Debes responder UNICAMENTE con un objeto JSON válido que contenga los campos que logres encontrar. No devuelvas explicaciones, textos introductorios, bloques de código markdown o caracteres extraños, SOLO el JSON.\n\n" +
                         "Campos del módulo '" + request.ModuleId + "' a extraer:\n";

            switch (request.ModuleId)
            {
                case "news":
                    prompt += "- title: Título o encabezado de la noticia.\n" +
                              "- slug: Slug amigable basado en el título.\n" +
                              "- summary: Resumen o entradilla corta de la noticia.\n" +
                              "- contentHtml: Cuerpo principal del artículo. Si tiene varios párrafos, estructúralo en HTML básico (usando etiquetas <p>, <strong>, etc.).\n" +
                              "- quoteText: Frase o cita destacada.\n" +
                              "- author: Nombre del autor.\n" +
                              "- category: Categoría sugerida (ej: Convocatorias, Prensa, Eventos, General).\n" +
                              "- date: Fecha de la publicación (formato yyyy-MM-dd).\n" +
                              "- imageUrl: Enlace o URL externa si se menciona.";
                    break;
                case "festivals":
                    prompt += "- name: Nombre del festival.\n" +
                              "- versionsCount: Cantidad de versiones o ediciones realizadas (número).\n" +
                              "- lastEditionDate: Fecha de la última versión (yyyy-MM-dd).\n" +
                              "- description: Descripción general del evento.\n" +
                              "- organizer: Entidad o persona organizadora.\n" +
                              "- organizerEmail: Correo electrónico del organizador.\n" +
                              "- organizerPhone: Teléfono del organizador.\n" +
                              "- organizerWebsiteUrl: Sitio web del organizador.\n" +
                              "- contactEmail: Correo de contacto del festival.\n" +
                              "- contactPhone: Teléfono de contacto del festival.\n" +
                              "- websiteUrl: Sitio web oficial del festival.\n" +
                              "- instagramUrl: Instagram del festival.\n" +
                              "- facebookUrl: Facebook del festival.\n" +
                              "- otherUrl: Otro enlace de interés.\n" +
                              "- hasCurrentYearEdition: Booleano (true/false) si tiene versión este año.\n" +
                              "- currentYearEditionStatus: Estado actual (ej: Convocatoria abierta, Planificación).\n" +
                              "- currentYearStartDate: Fecha inicio actual (yyyy-MM-dd).\n" +
                              "- currentYearEndDate: Fecha fin actual (yyyy-MM-dd).\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento colombiano donde se realiza.\n" +
                              "- municipality: Municipio colombiano donde se realiza.";
                    break;
                case "musicSchools":
                    prompt += "- name: Nombre de la escuela o proceso formativo.\n" +
                              "- schoolCategory: Categoría de la escuela.\n" +
                              "- schoolType: Tipo de escuela (Pública, Privada, Comunitaria).\n" +
                              "- responsibleEntity: Entidad o alcaldía responsable.\n" +
                              "- directorName: Nombre del director.\n" +
                              "- contactEmail: Correo electrónico de contacto.\n" +
                              "- contactPhone: Teléfono de contacto.\n" +
                              "- websiteUrl: Sitio web.\n" +
                              "- instagramUrl: Instagram.\n" +
                              "- facebookUrl: Facebook.\n" +
                              "- otherUrl: Otro enlace.\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento colombiano.\n" +
                              "- municipality: Municipio colombiano.\n" +
                              "- specificLocation: Lugar específico donde opera.\n" +
                              "- addressText: Dirección física.\n" +
                              "- trainingCapacity: Capacidad formativa máxima (número).\n" +
                              "- students: Cantidad de estudiantes actuales (número).\n" +
                              "- activeGroupsCount: Cantidad de grupos artísticos/musicales activos (número).\n" +
                              "- trainingProcesses: Descripción de los procesos de formación pedagógica.\n" +
                              "- musicalPractices: Prácticas musicales y géneros enseñados.\n" +
                              "- isActiveSchool: Booleano (true/false) si la escuela está operando actualmente.\n" +
                              "- observations: Observaciones o comentarios.";
                    break;
                case "musicMarkets":
                    prompt += "- name: Nombre del mercado musical.\n" +
                              "- editionsCount: Cantidad de ediciones (número).\n" +
                              "- periodicity: Periodicidad (Anual, Bienal, etc.).\n" +
                              "- description: Descripción general.\n" +
                              "- hasCurrentYearEdition: Booleano si tiene edición este año.\n" +
                              "- currentYearEditionStatus: Estado de la edición actual.\n" +
                              "- currentYearStartDate: Fecha inicio actual (yyyy-MM-dd).\n" +
                              "- currentYearEndDate: Fecha fin actual (yyyy-MM-dd).\n" +
                              "- responsibleEntity: Entidad responsable.\n" +
                              "- responsibleEntityEmail: Correo de la entidad.\n" +
                              "- responsibleEntityPhone: Teléfono de la entidad.\n" +
                              "- responsibleEntityWebsiteUrl: Sitio web de la entidad.\n" +
                              "- associatedFestivalDisplayName: Nombre de festival relacionado si aplica.\n" +
                              "- scopeType: Alcance (Local, Regional, Nacional, Internacional).\n" +
                              "- marketMode: Modalidad (Presencial, Virtual, Híbrido).\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento.\n" +
                              "- municipality: Municipio.\n" +
                              "- specificLocation: Lugar específico.";
                    break;
                case "organizations":
                    prompt += "- name: Nombre del centro o red de documentación.\n" +
                              "- organizationType: Tipo de centro o red.\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento.\n" +
                              "- municipality: Municipio.\n" +
                              "- territorialScope: Zona o alcance territorial.\n" +
                              "- description: Descripción y propósito.\n" +
                              "- contactEmail: Correo electrónico de contacto.\n" +
                              "- websiteUrl: Sitio web.\n" +
                              "- facebookUrl: Facebook.\n" +
                              "- instagramUrl: Instagram.\n" +
                              "- otherUrl: Otro enlace.";
                    break;
                case "spacesInfrastructure":
                    prompt += "- name: Nombre del lutier, artesano o colectivo.\n" +
                              "- actorType: Tipo de lutier (individual, taller, colectivo).\n" +
                              "- workshopName: Nombre del taller de lutería.\n" +
                              "- primaryFunction: Especialidad (ej: Cuerdas, Vientos, Percusión).\n" +
                              "- instruments: Instrumentos que construye o repara.\n" +
                              "- description: Descripción de saberes, trayectoria y trayectoria.\n" +
                              "- contactName: Nombre de contacto.\n" +
                              "- contactEmail: Correo de contacto.\n" +
                              "- contactPhone: Teléfono de contacto.\n" +
                              "- websiteUrl: Sitio web.\n" +
                              "- facebookUrl: Facebook.\n" +
                              "- instagramUrl: Instagram.\n" +
                              "- otherUrl: Otro enlace.\n" +
                              "- addressText: Dirección física.\n" +
                              "- zone: Zona o barrio.\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento.\n" +
                              "- municipality: Municipio.";
                    break;
                case "agenda":
                    prompt += "- title: Título del evento o convocatoria.\n" +
                              "- shortDescription: Breve entradilla o descripción corta.\n" +
                              "- description: Descripción larga y detallada.\n" +
                              "- category: Categoría del evento.\n" +
                              "- date: Fecha de inicio (yyyy-MM-dd).\n" +
                              "- endDate: Fecha de finalización (yyyy-MM-dd).\n" +
                              "- timeLabel: Hora de inicio (hh:mm).\n" +
                              "- endTimeLabel: Hora de finalización (hh:mm).\n" +
                              "- coverageLevel: Cobertura (Nacional, Departamental, Municipal).\n" +
                              "- department: Departamento.\n" +
                              "- municipality: Municipio.\n" +
                              "- location: Lugar físico o específico.\n" +
                              "- organizer: Entidad o persona organizadora.\n" +
                              "- imageUrl: Enlace de más información.";
                    break;
                case "editorial":
                case "gallery":
                    prompt += "- title: Título del álbum o colección.\n" +
                              "- summary: Descripción del contenido del álbum.\n" +
                              "- category: Categoría sugerida.\n" +
                              "- sortOrder: Orden visual (número).";
                    break;
            }

            prompt += "\n\nTexto o contexto a analizar:\n" + (request.Text ?? string.Empty);
            if (attachments.Count > 0)
            {
                prompt += "\n\nArchivos adjuntos: analiza los PDF o imágenes enviados, incluyendo texto visible, tablas, encabezados, datos de contacto, ubicación, fechas y enlaces. Si un dato no aparece, omítelo del JSON.";
            }

            try
            {
                var resultJson = await CallGeminiApiAsync(prompt, attachments, apiKey, cancellationToken);
                return Results.Ok(new { success = true, result = resultJson });
            }
            catch (Exception ex)
            {
                return Results.Ok(new
                {
                    success = false,
                    aiAvailable = false,
                    result = "{}",
                    message = "No fue posible enriquecer con IA externa. El frontend usará extracción local básica. Detalle: " + ex.Message
                });
            }
        });

        admin.MapPost("/records/{moduleId}/bulk", async (
            string moduleId,
            List<JsonElement> records,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var createdByUserId = await ResolveActingUserIdAsync(httpContext, dbContext, cancellationToken);
            var now = DateTime.UtcNow;

            var locations = await dbContext.DivipolaLocations.AsNoTracking().ToListAsync(cancellationToken);
            var deptsByName = locations
                .GroupBy(l => l.DepartmentName)
                .ToDictionary(g => NormalizeText(g.Key), g => g.First().DepartmentCode, StringComparer.OrdinalIgnoreCase);

            var munisByName = locations
                .GroupBy(l => new { l.DepartmentCode, l.MunicipalityName })
                .ToDictionary(g => (g.Key.DepartmentCode, NormalizeText(g.Key.MunicipalityName)), g => g.First().MunicipalityCode);

            var categories = await dbContext.Categories.AsNoTracking().ToListAsync(cancellationToken);
            
            var statuses = await dbContext.ContentStatuses.AsNoTracking().ToListAsync(cancellationToken);
            var defaultStatusId = statuses.FirstOrDefault(s => s.Code == "borrador")?.Id ?? 1;

            int importedCount = 0;

            foreach (var element in records)
            {
                var deptName = GetStringProp(element, "department");
                var muniName = GetStringProp(element, "municipality");

                var deptCode = string.Empty;
                if (!string.IsNullOrWhiteSpace(deptName))
                {
                    deptsByName.TryGetValue(NormalizeText(deptName), out deptCode);
                }

                var muniCode = string.Empty;
                if (!string.IsNullOrWhiteSpace(deptCode) && !string.IsNullOrWhiteSpace(muniName))
                {
                    munisByName.TryGetValue((deptCode, NormalizeText(muniName)), out muniCode);
                }

                switch (moduleId)
                {
                    case "agenda":
                        {
                            var title = GetStringProp(element, "title");
                            if (string.IsNullOrWhiteSpace(title)) continue;

                            var categoryName = GetStringProp(element, "category");
                            int? catId = null;
                            if (!string.IsNullOrWhiteSpace(categoryName))
                            {
                                catId = categories.FirstOrDefault(c => (c.ModuleCode == "agenda" || c.ModuleCode == "common") && NormalizeText(c.Name) == NormalizeText(categoryName))?.Id;
                            }

                            var row = new AgendaEventRow
                            {
                                Title = title.Trim(),
                                ShortDescription = GetStringProp(element, "shortDescription").Trim(),
                                Description = GetStringProp(element, "description").Trim(),
                                CategoryId = catId,
                                StartDate = GetDateProp(element, "date") ?? now.Date,
                                EndDate = GetDateProp(element, "endDate"),
                                StartTime = GetTimeProp(element, "timeLabel"),
                                EndTime = GetTimeProp(element, "endTimeLabel"),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                SpecificLocation = GetStringProp(element, "location").Trim(),
                                OrganizationName = GetStringProp(element, "organizer").Trim(),
                                MoreInfoUrl = GetStringProp(element, "imageUrl").Trim(),
                                SortOrder = GetIntProp(element, "sortOrder"),
                                StatusId = defaultStatusId,
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            if (string.IsNullOrWhiteSpace(row.ShortDescription)) row.ShortDescription = row.Description;
                            dbContext.AgendaEvents.Add(row);
                            importedCount++;
                        }
                        break;

                    case "news":
                        {
                            var title = GetStringProp(element, "title");
                            if (string.IsNullOrWhiteSpace(title)) continue;

                            var categoryName = GetStringProp(element, "category");
                            int? catId = null;
                            if (!string.IsNullOrWhiteSpace(categoryName))
                            {
                                catId = categories.FirstOrDefault(c => (c.ModuleCode == "news" || c.ModuleCode == "common") && NormalizeText(c.Name) == NormalizeText(categoryName))?.Id;
                            }

                            var slug = GetStringProp(element, "slug");
                            if (string.IsNullOrWhiteSpace(slug)) slug = BuildSlug(title);

                            var row = new NewsArticleRow
                            {
                                Title = title.Trim(),
                                SlugPrimary = BuildSlug(slug),
                                Lead = GetStringProp(element, "summary").Trim(),
                                Body = GetStringProp(element, "contentHtml").Trim(),
                                QuoteText = GetStringProp(element, "quoteText").Trim(),
                                AuthorName = GetStringProp(element, "author").Trim(),
                                CategoryId = catId,
                                PublishedDate = GetDateProp(element, "date") ?? now.Date,
                                PrimaryExternalUrl = GetStringProp(element, "imageUrl").Trim(),
                                PrimaryEmbedUrl = GetStringProp(element, "embedUrl").Trim(),
                                SortOrder = GetIntProp(element, "sortOrder"),
                                StatusId = defaultStatusId,
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            if (string.IsNullOrWhiteSpace(row.Body)) row.Body = row.Lead;
                            dbContext.NewsArticles.Add(row);
                            importedCount++;
                        }
                        break;

                    case "festivals":
                        {
                            var name = GetStringProp(element, "name");
                            if (string.IsNullOrWhiteSpace(name)) continue;

                            var row = new FestivalRow
                            {
                                Name = name.Trim(),
                                VersionsCount = GetIntProp(element, "versionsCount"),
                                LastEditionDate = GetDateProp(element, "lastEditionDate"),
                                Description = GetStringProp(element, "description").Trim(),
                                OrganizerDisplayName = GetStringProp(element, "organizer").Trim(),
                                OrganizerContactEmail = GetStringProp(element, "organizerEmail").Trim(),
                                OrganizerContactPhone = GetStringProp(element, "organizerPhone").Trim(),
                                OrganizerWebsiteUrl = GetStringProp(element, "organizerWebsiteUrl").Trim(),
                                ContactEmail = GetStringProp(element, "contactEmail").Trim(),
                                ContactPhone = GetStringProp(element, "contactPhone").Trim(),
                                WebsiteUrl = GetStringProp(element, "websiteUrl").Trim(),
                                InstagramUrl = GetStringProp(element, "instagramUrl").Trim(),
                                FacebookUrl = GetStringProp(element, "facebookUrl").Trim(),
                                OtherUrl = GetStringProp(element, "otherUrl").Trim(),
                                HasCurrentYearEdition = GetBoolProp(element, "hasCurrentYearEdition"),
                                CurrentYearEditionStatus = GetStringProp(element, "currentYearEditionStatus").Trim(),
                                CurrentYearStartDate = GetDateProp(element, "currentYearStartDate"),
                                CurrentYearEndDate = GetDateProp(element, "currentYearEndDate"),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                StatusCode = "borrador",
                                HasRegisteredOrganizer = false,
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            dbContext.FestivalRecords.Add(row);
                            importedCount++;
                        }
                        break;

                    case "musicSchools":
                        {
                            var name = GetStringProp(element, "name");
                            if (string.IsNullOrWhiteSpace(name)) continue;

                            var row = new SchoolRow
                            {
                                Name = name.Trim(),
                                SchoolCategory = GetStringProp(element, "schoolCategory").Trim(),
                                SchoolType = GetStringProp(element, "schoolType").Trim(),
                                ResponsibleEntityDisplayName = GetStringProp(element, "responsibleEntity").Trim(),
                                DirectorName = GetStringProp(element, "directorName").Trim(),
                                ContactEmail = GetStringProp(element, "contactEmail").Trim(),
                                ContactPhone = GetStringProp(element, "contactPhone").Trim(),
                                WebsiteUrl = GetStringProp(element, "websiteUrl").Trim(),
                                InstagramUrl = GetStringProp(element, "instagramUrl").Trim(),
                                FacebookUrl = GetStringProp(element, "facebookUrl").Trim(),
                                OtherUrl = GetStringProp(element, "otherUrl").Trim(),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                SpecificLocation = GetStringProp(element, "specificLocation").Trim(),
                                AddressText = GetStringProp(element, "addressText").Trim(),
                                Latitude = GetDecimalProp(element, "latitude"),
                                Longitude = GetDecimalProp(element, "longitude"),
                                StudentsAgeTotal = GetIntProp(element, "trainingCapacity"),
                                StudentsTotal = GetIntProp(element, "students") ?? 0,
                                ActiveGroupsCount = GetIntProp(element, "activeGroupsCount") ?? 0,
                                TrainingProcesses = GetStringProp(element, "trainingProcesses").Trim(),
                                MusicalPractices = GetStringProp(element, "musicalPractices").Trim(),
                                IsActiveSchool = GetBoolProp(element, "isActiveSchool", true),
                                Observations = GetStringProp(element, "observations").Trim(),
                                StatusCode = "borrador",
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            dbContext.SchoolRecords.Add(row);
                            importedCount++;
                        }
                        break;

                    case "musicMarkets":
                        {
                            var name = GetStringProp(element, "name");
                            if (string.IsNullOrWhiteSpace(name)) continue;

                            var row = new MarketRow
                            {
                                Name = name.Trim(),
                                EditionsCount = GetIntProp(element, "editionsCount"),
                                Periodicity = GetStringProp(element, "periodicity").Trim(),
                                Description = GetStringProp(element, "description").Trim(),
                                HasCurrentYearEdition = GetBoolProp(element, "hasCurrentYearEdition"),
                                CurrentYearEditionStatus = GetStringProp(element, "currentYearEditionStatus").Trim(),
                                CurrentYearStartDate = GetDateProp(element, "currentYearStartDate"),
                                CurrentYearEndDate = GetDateProp(element, "currentYearEndDate"),
                                ResponsibleEntityDisplayName = GetStringProp(element, "responsibleEntity").Trim(),
                                ResponsibleEntityContactEmail = GetStringProp(element, "responsibleEntityEmail").Trim(),
                                ResponsibleEntityContactPhone = GetStringProp(element, "responsibleEntityPhone").Trim(),
                                ResponsibleEntityWebsiteUrl = GetStringProp(element, "responsibleEntityWebsiteUrl").Trim(),
                                AssociatedFestivalId = GetIntProp(element, "associatedFestivalId"),
                                AssociatedFestivalDisplayName = GetStringProp(element, "associatedFestivalDisplayName").Trim(),
                                ScopeType = GetStringProp(element, "scopeType").Trim(),
                                MarketMode = GetStringProp(element, "marketMode").Trim(),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                SpecificLocation = GetStringProp(element, "specificLocation").Trim(),
                                StatusCode = "borrador",
                                HasAssociatedFestival = !string.IsNullOrWhiteSpace(GetStringProp(element, "associatedFestivalDisplayName")),
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            dbContext.MarketRecords.Add(row);
                            importedCount++;
                        }
                        break;

                    case "organizations":
                        {
                            var name = GetStringProp(element, "name");
                            if (string.IsNullOrWhiteSpace(name)) continue;

                            var row = new OrganizationRow
                            {
                                Name = name.Trim(),
                                OrganizationType = GetStringProp(element, "organizationType").Trim(),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                TerritorialScope = GetStringProp(element, "territorialScope").Trim(),
                                Latitude = GetDecimalProp(element, "latitude"),
                                Longitude = GetDecimalProp(element, "longitude"),
                                Description = GetStringProp(element, "description").Trim(),
                                ContactEmail = GetStringProp(element, "contactEmail").Trim(),
                                WebsiteUrl = GetStringProp(element, "websiteUrl").Trim(),
                                FacebookUrl = GetStringProp(element, "facebookUrl").Trim(),
                                InstagramUrl = GetStringProp(element, "instagramUrl").Trim(),
                                OtherUrl = GetStringProp(element, "otherUrl").Trim(),
                                StatusCode = "borrador",
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            dbContext.Organizations.Add(row);
                            importedCount++;
                        }
                        break;

                    case "spacesInfrastructure":
                        {
                            var workshopName = GetStringProp(element, "workshopName");
                            var name = GetStringProp(element, "name");
                            if (string.IsNullOrWhiteSpace(workshopName) && string.IsNullOrWhiteSpace(name)) continue;
                            if (string.IsNullOrWhiteSpace(name)) name = workshopName;

                            var row = new SpaceInfrastructureRow
                            {
                                ResponsibleEntityDisplayName = name.Trim(),
                                ActorType = GetStringProp(element, "actorType", "individual").ToLowerInvariant(),
                                Name = string.IsNullOrWhiteSpace(workshopName) ? name.Trim() : workshopName.Trim(),
                                PrimaryFunction = GetStringProp(element, "primaryFunction").Trim(),
                                SecondaryFunctions = GetStringProp(element, "instruments").Trim(),
                                MainUses = GetStringProp(element, "description").Trim(),
                                ContactPersonName = GetStringProp(element, "contactName").Trim(),
                                ContactEmail = GetStringProp(element, "contactEmail").Trim(),
                                ContactPhone = GetStringProp(element, "contactPhone").Trim(),
                                WebsiteUrl = GetStringProp(element, "websiteUrl").Trim(),
                                FacebookUrl = GetStringProp(element, "facebookUrl").Trim(),
                                InstagramUrl = GetStringProp(element, "instagramUrl").Trim(),
                                OtherUrl = GetStringProp(element, "otherUrl").Trim(),
                                AddressText = GetStringProp(element, "addressText").Trim(),
                                SpecificLocation = GetStringProp(element, "zone").Trim(),
                                Latitude = GetDecimalProp(element, "latitude"),
                                Longitude = GetDecimalProp(element, "longitude"),
                                CoverageLevel = ResolveCoverageLevel(GetStringProp(element, "coverageLevel", "municipal"), muniCode, deptCode),
                                DepartmentCode = deptCode ?? string.Empty,
                                MunicipalityCode = string.IsNullOrWhiteSpace(muniCode) ? null : muniCode,
                                StatusCode = "borrador",
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now
                            };

                            dbContext.SpacesInfrastructure.Add(row);
                            importedCount++;
                        }
                        break;

                    case "editorial":
                    case "gallery":
                        {
                            var title = GetStringProp(element, "title");
                            if (string.IsNullOrWhiteSpace(title)) continue;

                            var categoryName = GetStringProp(element, "category");
                            int? catId = null;
                            if (!string.IsNullOrWhiteSpace(categoryName))
                            {
                                catId = categories.FirstOrDefault(c => (c.ModuleCode == "editorial" || c.ModuleCode == "common") && NormalizeText(c.Name) == NormalizeText(categoryName))?.Id;
                            }

                            var row = new GalleryAlbumRow
                            {
                                Title = title.Trim(),
                                Description = GetStringProp(element, "summary").Trim(),
                                CategoryId = catId,
                                SortOrder = GetIntProp(element, "sortOrder") ?? 1,
                                StatusId = defaultStatusId,
                                CreatedByUserId = createdByUserId,
                                CreatedAt = now,
                                PublishedAt = now
                            };

                            dbContext.GalleryAlbums.Add(row);
                            importedCount++;
                        }
                        break;
                }
            }

            if (importedCount > 0)
            {
                try
                {
                    NormalizePendingCoverageLevels(dbContext);
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException ex)
                {
                    var detail = ex.InnerException?.Message ?? ex.Message;
                    return Results.BadRequest(new
                    {
                        message = "No fue posible guardar la importación en la base de datos.",
                        detail = BuildImportErrorDetail(detail)
                    });
                }
            }

            return Results.Ok(new { success = true, count = importedCount });
        });

        return group;
    }

    private static ValueTask<object?> ValidateAdminAccessAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();

        if (context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            return next(context);
        }

        var configuredApiKey = configuration["Security:AdminApiKey"] ?? configuration["PNMC_ADMIN_API_KEY"];
        if (!string.IsNullOrWhiteSpace(configuredApiKey))
        {
            var providedApiKey = context.HttpContext.Request.Headers["X-Admin-Api-Key"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(providedApiKey))
            {
                return ValueTask.FromResult<object?>(Results.Unauthorized());
            }

            var configuredBytes = Encoding.UTF8.GetBytes(configuredApiKey);
            var providedBytes = Encoding.UTF8.GetBytes(providedApiKey);
            if (!CryptographicOperations.FixedTimeEquals(configuredBytes, providedBytes))
            {
                return ValueTask.FromResult<object?>(Results.Unauthorized());
            }

            return next(context);
        }

        if (environment.IsEnvironment("Test"))
        {
            return next(context);
        }

        if (environment.IsDevelopment() || environment.IsEnvironment("Local"))
        {
            return ValueTask.FromResult<object?>(Results.Unauthorized());
        }

        return ValueTask.FromResult<object?>(Results.Problem(
            title: "Admin authentication is not configured.",
            statusCode: StatusCodes.Status503ServiceUnavailable));
    }

    private static async Task<int> ResolveActingUserIdAsync(
        HttpContext httpContext,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rawUserId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(rawUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId))
        {
            var userExists = await dbContext.Users.AsNoTracking()
                .AnyAsync(user => user.Id == userId && user.IsActive, cancellationToken);
            if (userExists)
            {
                return userId;
            }
        }

        return await EnsureSystemUserAsync(dbContext, cancellationToken);
    }

    private static async Task<int> ResolveStatusIdAsync(PnmcDbContext dbContext, string? statusCode, CancellationToken cancellationToken)
    {
        var normalizedStatus = CleanStatusCode(statusCode);
        var requestedStatus = await dbContext.ContentStatuses.AsNoTracking()
            .FirstOrDefaultAsync(status => status.Code == normalizedStatus, cancellationToken);

        if (requestedStatus is not null)
        {
            return requestedStatus.Id;
        }

        var draftStatus = await dbContext.ContentStatuses.AsNoTracking()
            .FirstOrDefaultAsync(status => status.Code == "borrador", cancellationToken);

        if (draftStatus is not null)
        {
            return draftStatus.Id;
        }

        var firstStatus = await dbContext.ContentStatuses.AsNoTracking()
            .OrderBy(status => status.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (firstStatus is null)
        {
            throw new InvalidOperationException("No hay estados configurados en ContentStatuses.");
        }

        return firstStatus.Id;
    }

    private static string CleanStatusCode(string? statusCode)
    {
        return string.IsNullOrWhiteSpace(statusCode) ? "borrador" : statusCode.Trim().ToLowerInvariant();
    }

    private static string CleanRoleName(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool CanSetRecordStatus(string role, string currentStatus, string targetStatus)
    {
        if (role == "webmaster")
        {
            return IsKnownContentStatus(targetStatus);
        }

        if (!IsValidStatusTransition(currentStatus, targetStatus))
        {
            return false;
        }

        return role switch
        {
            "webmaster" => true,
            "gestor_interno" => targetStatus is "ajustes_solicitados" or "aprobado" or "rechazado",
            _ => false
        };
    }

    private static bool IsKnownContentStatus(string status)
    {
        return status is "borrador"
            or "en_revision"
            or "ajustes_solicitados"
            or "aprobado"
            or "publicado"
            or "rechazado"
            or "archivado";
    }

    private static bool IsValidStatusTransition(string currentStatus, string targetStatus)
    {
        return currentStatus switch
        {
            "borrador" => targetStatus == "en_revision",
            "en_revision" => targetStatus is "ajustes_solicitados" or "aprobado" or "rechazado",
            "ajustes_solicitados" => targetStatus == "en_revision",
            "aprobado" => targetStatus == "publicado",
            "publicado" => targetStatus == "archivado",
            _ => false
        };
    }

    private static string ActionForStatus(string status)
    {
        return status switch
        {
            "en_revision" => "enviar_revision",
            "ajustes_solicitados" => "solicitar_ajustes",
            "aprobado" => "aprobar",
            "publicado" => "publicar",
            "archivado" => "archivar",
            "rechazado" => "rechazar",
            _ => "actualizar"
        };
    }

    private static async Task<string?> ResolveCurrentRecordStatusAsync(
        PnmcDbContext dbContext,
        string moduleId,
        int recordId,
        CancellationToken cancellationToken)
    {
        return moduleId switch
        {
            "agenda" => await ResolveContentStatusCodeAsync(
                dbContext,
                await dbContext.AgendaEvents.AsNoTracking()
                    .Where(item => item.Id == recordId)
                    .Select(item => (int?)item.StatusId)
                    .FirstOrDefaultAsync(cancellationToken),
                cancellationToken),
            "news" => await ResolveContentStatusCodeAsync(
                dbContext,
                await dbContext.NewsArticles.AsNoTracking()
                    .Where(item => item.Id == recordId)
                    .Select(item => (int?)item.StatusId)
                    .FirstOrDefaultAsync(cancellationToken),
                cancellationToken),
            "gallery" => await ResolveContentStatusCodeAsync(
                dbContext,
                await dbContext.GalleryAlbums.AsNoTracking()
                    .Where(item => item.Id == recordId)
                    .Select(item => (int?)item.StatusId)
                    .FirstOrDefaultAsync(cancellationToken),
                cancellationToken),
            "editorial" => await dbContext.EditorialCatalogResources.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.IsActive ? "publicado" : "archivado")
                .FirstOrDefaultAsync(cancellationToken),
            "festivals" => await dbContext.FestivalRecords.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.StatusCode)
                .FirstOrDefaultAsync(cancellationToken),
            "musicSchools" => await dbContext.SchoolRecords.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.StatusCode)
                .FirstOrDefaultAsync(cancellationToken),
            "musicMarkets" => await dbContext.MarketRecords.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.StatusCode)
                .FirstOrDefaultAsync(cancellationToken),
            "organizations" => await dbContext.Organizations.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.StatusCode)
                .FirstOrDefaultAsync(cancellationToken),
            "spacesInfrastructure" => await dbContext.SpacesInfrastructure.AsNoTracking()
                .Where(item => item.Id == recordId)
                .Select(item => item.StatusCode)
                .FirstOrDefaultAsync(cancellationToken),
            _ => null
        };
    }

    private static async Task<string?> ResolveContentStatusCodeAsync(
        PnmcDbContext dbContext,
        int? statusId,
        CancellationToken cancellationToken)
    {
        if (statusId is null)
        {
            return null;
        }

        return await dbContext.ContentStatuses.AsNoTracking()
            .Where(status => status.Id == statusId.Value)
            .Select(status => status.Code)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static async Task WriteRevisionHistoryAsync(
        PnmcDbContext dbContext,
        string moduleId,
        string recordId,
        string previousStatus,
        string nextStatus,
        string action,
        int userId,
        string? comment,
        string? rejectionReason,
        string? observedFieldsJson,
        CancellationToken cancellationToken)
    {
        if ((dbContext.Database.ProviderName ?? string.Empty).Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO RegistrosRevisionHistorial
                    (ModuloId, RegistroId, EstadoAnterior, EstadoNuevo, Accion, Comentario, MotivoRechazo, CamposObservados, IdUsuario, Fecha)
                VALUES
                    ({moduleId}, {recordId}, {previousStatus}, {nextStatus}, {action}, {comment}, {rejectionReason}, {observedFieldsJson}, {userId}, {DateTime.UtcNow})",
                cancellationToken);
            return;
        }

        await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
            INSERT INTO dbo.RegistrosRevisionHistorial
                (ModuloId, RegistroId, EstadoAnterior, EstadoNuevo, Accion, Comentario, MotivoRechazo, CamposObservados, IdUsuario, Fecha)
            VALUES
                ({moduleId}, {recordId}, {previousStatus}, {nextStatus}, {action}, {comment}, {rejectionReason}, {observedFieldsJson}, {userId}, SYSUTCDATETIME())",
            cancellationToken);
    }

    private static async Task<int> EnsureSystemUserAsync(PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var existingUser = await dbContext.Users.AsNoTracking()
            .OrderBy(user => user.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingUser is not null)
        {
            return existingUser.Id;
        }

        var firstRole = await dbContext.Roles.AsNoTracking()
            .OrderBy(role => role.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (firstRole is null)
        {
            throw new InvalidOperationException("No hay roles disponibles para crear el usuario del sistema PNMC.");
        }

        var systemUser = new UserRow
        {
            FullName = "Sistema PNMC",
            Email = "system@pnmc.local",
            PasswordHash = "not_applicable",
            RoleId = firstRole.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(systemUser);
        await dbContext.SaveChangesAsync(cancellationToken);

        return systemUser.Id;
    }

    private static async Task<int?> ResolveCategoryIdAsync(
        PnmcDbContext dbContext,
        string moduleCode,
        string categoryName,
        CancellationToken cancellationToken)
    {
        if (ValidationHelpers.IsMissing(categoryName))
        {
            return null;
        }

        var normalizedTarget = NormalizeText(categoryName);

        var candidates = await dbContext.Categories.AsNoTracking()
            .Where(item => item.ModuleCode == moduleCode || item.ModuleCode == "common")
            .ToListAsync(cancellationToken);

        var category = candidates.FirstOrDefault(item => NormalizeText(item.Name) == normalizedTarget);

        return category?.Id;
    }

    private static async Task<AgendaEventRow?> FindAgendaEventAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.AgendaEvents.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<NewsArticleRow?> FindNewsArticleAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.NewsArticles.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<FestivalRow?> FindFestivalAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.FestivalRecords.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<SchoolRow?> FindSchoolAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.SchoolRecords.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<MarketRow?> FindMarketAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.MarketRecords.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<GalleryAlbumRow?> FindGalleryAlbumAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.GalleryAlbums.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<EditorialCatalogResourceRow?> FindEditorialCatalogResourceAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.EditorialCatalogResources.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<int> ResolveNextGalleryAlbumSortOrderAsync(PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var maxSortOrder = await dbContext.GalleryAlbums
            .Select(item => (int?)item.SortOrder)
            .MaxAsync(cancellationToken);

        return (maxSortOrder ?? 0) + 1;
    }

    private static async Task<OrganizationRow?> FindOrganizationAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.Organizations.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<SpaceInfrastructureRow?> FindSpaceInfrastructureAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.SpacesInfrastructure.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<ProcessEntityRelationRow?> FindProcessEntityRelationAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.ProcessEntityRelations.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<ProcessRelationRow?> FindProcessRelationAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.ProcessRelations.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
    }

    private static async Task<string> ResolveDepartmentCodeAsync(
        PnmcDbContext dbContext,
        string departmentValue,
        CancellationToken cancellationToken)
    {
        if (ValidationHelpers.IsMissing(departmentValue))
        {
            return string.Empty;
        }

        var normalizedTarget = NormalizeText(departmentValue);
        var rows = await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(item => new { item.DepartmentCode, item.DepartmentName })
            .Select(group => new { group.Key.DepartmentCode, group.Key.DepartmentName })
            .ToListAsync(cancellationToken);

        var byCode = rows.FirstOrDefault(item => NormalizeText(item.DepartmentCode) == normalizedTarget);
        if (byCode is not null) return byCode.DepartmentCode;

        var byName = rows.FirstOrDefault(item => NormalizeText(item.DepartmentName) == normalizedTarget);
        return byName?.DepartmentCode ?? string.Empty;
    }

    private static async Task<string?> ResolveMunicipalityCodeAsync(
        PnmcDbContext dbContext,
        string departmentCode,
        string municipalityValue,
        CancellationToken cancellationToken)
    {
        if (ValidationHelpers.IsMissing(municipalityValue))
        {
            return null;
        }

        var normalizedTarget = NormalizeText(municipalityValue);
        var rows = await dbContext.DivipolaLocations.AsNoTracking()
            .Where(item => item.DepartmentCode == departmentCode)
            .ToListAsync(cancellationToken);

        var byCode = rows.FirstOrDefault(item => NormalizeText(item.MunicipalityCode) == normalizedTarget);
        if (byCode is not null) return byCode.MunicipalityCode;

        var byName = rows.FirstOrDefault(item => NormalizeText(item.MunicipalityName) == normalizedTarget);
        return byName?.MunicipalityCode;
    }

    private static DateTime ParseDateOrDefault(string value, DateTime fallback)
        => DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? parsed.Date
            : fallback.Date;

    private static DateTime? ParseDateOrNull(string value)
        => DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? parsed.Date
            : null;

    private static TimeSpan? ParseTimeOrNull(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsedDate))
        {
            return parsedDate.TimeOfDay;
        }

        if (TimeSpan.TryParse(value, CultureInfo.InvariantCulture, out var parsedTime))
        {
            return parsedTime;
        }

        return null;
    }

    private static short? ParseYearOrNull(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (short.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var year))
        {
            return year;
        }

        return null;
    }

    private static int? ParseIntOrNull(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return int.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;
    }

    private static List<string> SplitKeywords(string value)
    {
        return (value ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToList();
    }

    private static string ResolveCoverageLevel(string? requestedCoverage, string? municipalityCode, string? departmentCode)
    {
        var normalized = string.IsNullOrWhiteSpace(requestedCoverage) ? string.Empty : requestedCoverage.Trim().ToLowerInvariant();

        return normalized switch
        {
            "nacional" => "nacional",
            "departamental" => !string.IsNullOrWhiteSpace(departmentCode) ? "departamental" : "nacional",
            "municipal" => !string.IsNullOrWhiteSpace(municipalityCode)
                ? "municipal"
                : !string.IsNullOrWhiteSpace(departmentCode)
                    ? "departamental"
                    : "nacional",
            _ => !string.IsNullOrWhiteSpace(municipalityCode)
                ? "municipal"
                : !string.IsNullOrWhiteSpace(departmentCode)
                    ? "departamental"
                    : "nacional"
        };
    }

    private static void NormalizePendingCoverageLevels(PnmcDbContext dbContext)
    {
        foreach (var entry in dbContext.ChangeTracker.Entries<FestivalRow>())
        {
            entry.Entity.CoverageLevel = ResolveCoverageLevel(entry.Entity.CoverageLevel, entry.Entity.MunicipalityCode, entry.Entity.DepartmentCode);
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<SchoolRow>())
        {
            entry.Entity.CoverageLevel = ResolveCoverageLevel(entry.Entity.CoverageLevel, entry.Entity.MunicipalityCode, entry.Entity.DepartmentCode);
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<MarketRow>())
        {
            entry.Entity.CoverageLevel = ResolveCoverageLevel(entry.Entity.CoverageLevel, entry.Entity.MunicipalityCode, entry.Entity.DepartmentCode);
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<OrganizationRow>())
        {
            entry.Entity.CoverageLevel = ResolveCoverageLevel(entry.Entity.CoverageLevel, entry.Entity.MunicipalityCode, entry.Entity.DepartmentCode);
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<SpaceInfrastructureRow>())
        {
            entry.Entity.CoverageLevel = ResolveCoverageLevel(entry.Entity.CoverageLevel, entry.Entity.MunicipalityCode, entry.Entity.DepartmentCode);
        }
    }

    private static string BuildImportErrorDetail(string detail)
    {
        if (detail.Contains("CK_Festivales_NivelCobertura", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("NivelCobertura", StringComparison.OrdinalIgnoreCase))
        {
            return "La cobertura no coincide con la ubicación. Si seleccionas Municipal, el municipio debe existir en DIVIPOLA para el departamento indicado. El backend intentó normalizar la fila; revisa que Departamento y Municipio vengan desde las listas de la plantilla.";
        }

        return detail;
    }

    private static string DisplayCoverageLevel(string? coverageLevel)
    {
        var normalized = string.IsNullOrWhiteSpace(coverageLevel) ? string.Empty : coverageLevel.Trim().ToLowerInvariant();
        return normalized switch
        {
            "municipal" => "Municipal",
            "departamental" => "Departamental",
            "nacional" => "Nacional",
            _ => string.IsNullOrWhiteSpace(coverageLevel) ? string.Empty : ToTitleCaseEs(coverageLevel)
        };
    }

    private static string ToTitleCaseEs(string value)
    {
        var cleaned = value.Trim().ToLowerInvariant();
        return CultureInfo.GetCultureInfo("es-CO").TextInfo.ToTitleCase(cleaned)
            .Replace("D.c.", "D.C.", StringComparison.OrdinalIgnoreCase);
    }

    private static string JoinKeywords(IEnumerable<string>? keywords)
    {
        if (keywords is null) return string.Empty;
        return string.Join(", ", keywords
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static string BuildMarketOperationalNotes(int averageProjects, int averageBuyers)
    {
        var fragments = new List<string>();
        if (averageProjects > 0)
        {
            fragments.Add($"averageProjects:{averageProjects}");
        }

        if (averageBuyers > 0)
        {
            fragments.Add($"averageBuyers:{averageBuyers}");
        }

        return fragments.Count == 0
            ? string.Empty
            : $"PnmcMetadata[{string.Join(";", fragments)}]";
    }

    private static string BuildSlug(string value)
    {
        var normalized = NormalizeText(value)
            .ToLowerInvariant()
            .Replace(' ', '-')
            .Replace("--", "-")
            .Trim('-');

        return string.IsNullOrWhiteSpace(normalized)
            ? $"news-{DateTime.UtcNow:yyyyMMddHHmmss}"
            : normalized;
    }

    private static object ToAdminRecord(
        int id,
        string title,
        string table,
        string department,
        string municipality,
        string status,
        string statusLabel,
        DateTime? updatedAt,
        IReadOnlyDictionary<string, object?> metadata)
    {
        return new
        {
            id = id.ToString(CultureInfo.InvariantCulture),
            title,
            table,
            department,
            municipality,
            status,
            statusLabel,
            updatedAt = updatedAt?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
            metadata
        };
    }

    private static async Task<AdminModuleMonitorDto> BuildModuleMonitorAsync(
        string id,
        string label,
        string area,
        IQueryable<int> statusIds,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rows = await statusIds.ToListAsync(cancellationToken);
        var statuses = await dbContext.ContentStatuses.AsNoTracking().ToDictionaryAsync(item => item.Id, item => item, cancellationToken);
        var grouped = rows
            .GroupBy(statusId => statusId)
            .Select(group =>
            {
                var status = statuses.GetValueOrDefault(group.Key);
                return (object)new
                {
                    code = status?.Code ?? group.Key.ToString(CultureInfo.InvariantCulture),
                    label = status?.Name ?? group.Key.ToString(CultureInfo.InvariantCulture),
                    count = group.Count()
                };
            })
            .OrderBy(item => item.ToString())
            .ToList();

        return new AdminModuleMonitorDto(id, label, area, rows.Count, grouped);
    }

    private static AdminModuleMonitorDto BuildModuleMonitor(
        string id,
        string label,
        string area,
        IReadOnlyList<string> statusCodes,
        IReadOnlyDictionary<string, string> statusNames)
    {
        var grouped = statusCodes
            .Select(CleanStatusCode)
            .GroupBy(statusCode => statusCode)
            .Select(group => (object)new
            {
                code = group.Key,
                label = statusNames.GetValueOrDefault(group.Key, group.Key),
                count = group.Count()
            })
            .OrderBy(item => item.ToString())
            .ToList();

        return new AdminModuleMonitorDto(id, label, area, statusCodes.Count, grouped);
    }

    private static async Task<object?> UpdateContentStatusAsync(
        DbSet<AgendaEventRow> rows,
        int id,
        int statusId,
        int actingUserId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusId = statusId;
        row.UpdatedAt = now;
        ApplyContentWorkflow(row, actingUserId, now, statusId);
        return new { id = row.Id, statusId };
    }

    private static async Task<object?> UpdateContentStatusAsync(
        DbSet<NewsArticleRow> rows,
        int id,
        int statusId,
        int actingUserId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusId = statusId;
        row.UpdatedAt = now;
        row.ReviewedByUserId = actingUserId;
        row.ApprovedByUserId = actingUserId;
        return new { id = row.Id, statusId };
    }

    private static async Task<object?> UpdateContentStatusAsync(
        DbSet<GalleryAlbumRow> rows,
        int id,
        int statusId,
        int actingUserId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusId = statusId;
        row.UpdatedAt = now;
        row.ReviewedByUserId = actingUserId;
        row.ApprovedByUserId = actingUserId;
        return new { id = row.Id, statusId };
    }

    private static async Task<object?> UpdateEditorialCatalogStatusAsync(
        DbSet<EditorialCatalogResourceRow> rows,
        int id,
        string statusCode,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.IsActive = statusCode != "archivado" && statusCode != "rechazado";
        row.ImportedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static void ApplyContentWorkflow(AgendaEventRow row, int actingUserId, DateTime now, int statusId)
    {
        row.ReviewedByUserId = actingUserId;
        row.ApprovedByUserId = actingUserId;
        row.UpdatedAt = now;
        _ = statusId;
    }

    private static async Task<object?> UpdateEcosystemStatusAsync(DbSet<FestivalRow> rows, int id, string statusCode, DateTime now, CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusCode = statusCode;
        row.UpdatedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static async Task<object?> UpdateEcosystemStatusAsync(DbSet<SchoolRow> rows, int id, string statusCode, DateTime now, CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusCode = statusCode;
        row.UpdatedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static async Task<object?> UpdateEcosystemStatusAsync(DbSet<MarketRow> rows, int id, string statusCode, DateTime now, CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusCode = statusCode;
        row.UpdatedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static async Task<object?> UpdateEcosystemStatusAsync(DbSet<OrganizationRow> rows, int id, string statusCode, DateTime now, CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusCode = statusCode;
        row.UpdatedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static async Task<object?> UpdateEcosystemStatusAsync(DbSet<SpaceInfrastructureRow> rows, int id, string statusCode, DateTime now, CancellationToken cancellationToken)
    {
        var row = await rows.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null) return null;
        row.StatusCode = statusCode;
        row.UpdatedAt = now;
        return new { id = row.Id, status = statusCode };
    }

    private static async Task<Dictionary<string, string>> BuildDepartmentDictionaryAsync(
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(item => new { item.DepartmentCode, item.DepartmentName })
            .Select(group => new { group.Key.DepartmentCode, group.Key.DepartmentName })
            .ToDictionaryAsync(item => item.DepartmentCode, item => ToTitleCaseEs(item.DepartmentName), cancellationToken);
    }

    private static async Task<Dictionary<string, string>> BuildMunicipalityDictionaryAsync(
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(item => new { item.MunicipalityCode, item.MunicipalityName })
            .Select(group => new { group.Key.MunicipalityCode, group.Key.MunicipalityName })
            .ToDictionaryAsync(item => item.MunicipalityCode, item => ToTitleCaseEs(item.MunicipalityName), cancellationToken);
    }

    private static string ResolveDepartmentName(string? departmentCode, IReadOnlyDictionary<string, string> departments)
    {
        if (string.IsNullOrWhiteSpace(departmentCode)) return string.Empty;
        return departments.TryGetValue(departmentCode, out var name) ? name : departmentCode;
    }

    private static string ResolveMunicipalityName(string? municipalityCode, IReadOnlyDictionary<string, string> municipalities)
    {
        if (string.IsNullOrWhiteSpace(municipalityCode)) return string.Empty;
        return municipalities.TryGetValue(municipalityCode, out var name) ? name : municipalityCode;
    }

    private static PagedResponse<T> ToPage<T>(IReadOnlyList<T> items, int? limit, int? offset)
    {
        var safeOffset = Math.Max(offset ?? 0, 0);
        var safeLimit = Math.Clamp(limit ?? items.Count, 1, Math.Max(items.Count, 1));
        return new PagedResponse<T>(
            items.Skip(safeOffset).Take(safeLimit).ToList(),
            safeLimit,
            safeOffset,
            items.Count);
    }

    private static string NormalizeText(string value)
    {
        return (value ?? string.Empty)
            .Trim()
            .Normalize(NormalizationForm.FormD)
            .Where(ch => ch <= 127)
            .Aggregate(string.Empty, (current, ch) => current + ch)
            .ToUpperInvariant();
    }

    private sealed record AIAnalysisRequest(string? Text, string ModuleId, IReadOnlyList<AIAnalysisAttachment>? Attachments);

    private sealed record AIAnalysisAttachment(string FileName, string MimeType, string Base64Data);

    private static bool IsSupportedAiAttachment(string mimeType)
    {
        return mimeType is "application/pdf"
            or "image/png"
            or "image/jpeg"
            or "image/webp"
            or "image/gif";
    }

    private static async Task<string> CallGeminiApiAsync(
        string prompt,
        IReadOnlyList<AIAnalysisAttachment> attachments,
        string apiKey,
        CancellationToken cancellationToken)
    {
        using var client = new HttpClient();
        var requestUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        var parts = new List<object> { new { text = prompt } };
        foreach (var attachment in attachments)
        {
            parts.Add(new
            {
                inline_data = new
                {
                    mime_type = attachment.MimeType,
                    data = attachment.Base64Data
                }
            });
        }
        
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json"
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(requestUrl, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(responseJson);
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text ?? string.Empty;
    }

    private static string GetStringProp(JsonElement element, string propName, string defaultValue = "")
    {
        if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString() ?? defaultValue;
        }
        return defaultValue;
    }

    private static int? GetIntProp(JsonElement element, string propName)
    {
        if (element.TryGetProperty(propName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out var val)) return val;
            if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out var sVal)) return sVal;
        }
        return null;
    }

    private static double? GetDoubleProp(JsonElement element, string propName)
    {
        if (element.TryGetProperty(propName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDouble(out var val)) return val;
            if (prop.ValueKind == JsonValueKind.String && double.TryParse(prop.GetString(), out var sVal)) return sVal;
        }
        return null;
    }

    private static decimal? GetDecimalProp(JsonElement element, string propName)
    {
        if (element.TryGetProperty(propName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var val)) return val;
            if (prop.ValueKind == JsonValueKind.String && decimal.TryParse(prop.GetString(), out var sVal)) return sVal;
        }
        return null;
    }

    private static bool GetBoolProp(JsonElement element, string propName, bool defaultValue = false)
    {
        if (element.TryGetProperty(propName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.True) return true;
            if (prop.ValueKind == JsonValueKind.False) return false;
            if (prop.ValueKind == JsonValueKind.String)
            {
                var s = prop.GetString()?.ToLowerInvariant();
                return s == "true" || s == "si" || s == "1" || s == "yes";
            }
        }
        return defaultValue;
    }

    private static DateTime? GetDateProp(JsonElement element, string propName)
    {
        var s = GetStringProp(element, propName);
        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt)) return dt.Date;
        return null;
    }

    private static TimeSpan? GetTimeProp(JsonElement element, string propName)
    {
        var s = GetStringProp(element, propName);
        if (TimeSpan.TryParse(s, CultureInfo.InvariantCulture, out var ts)) return ts;
        return null;
    }
}
