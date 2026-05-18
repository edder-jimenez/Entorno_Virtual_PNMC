using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;
using PNMC.Infrastructure.Common;

namespace PNMC.Api.Endpoints;

public static class AdminDataEndpoints
{
    public static RouteGroupBuilder MapAdminDataEndpoints(this RouteGroupBuilder group)
    {
        var admin = group.MapGroup("/admin/data").WithTags("admin-data");
        admin.AddEndpointFilter(ValidateAdminApiKeyAsync);

        admin.MapGet("/schema", () =>
        {
            var schema = new
            {
                agenda = new
                {
                    table = "AgendaEvents",
                    required = new[] { "title", "date", "department" },
                    fields = new[]
                    {
                        "id", "title", "description", "category", "date", "timeLabel", "location",
                        "municipality", "department", "organizer", "imageUrl", "tags"
                    }
                },
                news = new
                {
                    table = "News",
                    required = new[] { "title" },
                    fields = new[] { "id", "date", "category", "title", "summary", "contentHtml", "imageUrl" }
                },
                festivals = new
                {
                    table = "Festivals",
                    required = new[] { "name", "department" },
                    fields = new[] { "id", "name", "department", "municipality", "description" }
                },
                musicSchools = new
                {
                    table = "MusicSchools",
                    required = new[] { "name", "department" },
                    fields = new[] { "id", "name", "department", "municipality", "students", "activeGroupsCount" }
                },
                musicMarkets = new
                {
                    table = "MusicMarkets",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "periodicity",
                        "editionsCount", "associatedFestivalDisplayName", "averageProjects", "averageBuyers"
                    }
                },
                editorial = new
                {
                    table = "EditorialItems (+ EditorialClassifications + EditorialBibliographicRecords + EditorialAvailability)",
                    required = new[] { "title" },
                    fields = new[]
                    {
                        "id", "title", "summary", "category", "section", "sectionPath", "publicationType",
                        "author", "corporateAuthor", "year", "url", "keywords"
                    }
                },
                organizations = new
                {
                    table = "Organizations",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "organizationType",
                        "territorialScope", "contactEmail", "contactPhone", "websiteUrl"
                    }
                },
                spacesInfrastructure = new
                {
                    table = "SpacesInfrastructure",
                    required = new[] { "name", "department" },
                    fields = new[]
                    {
                        "id", "name", "department", "municipality", "actorType",
                        "primaryFunction", "maxCapacityApprox", "contactEmail", "contactPhone", "websiteUrl"
                    }
                },
                divipola = new { table = "DivipolaLocations" },
                processEntityRelations = new
                {
                    table = "ProcessEntityRelations",
                    required = new[] { "processType", "processId", "entityType", "entityId", "relationshipType" },
                    fields = new[] { "id", "processType", "processId", "entityType", "entityId", "relationshipType", "notes" }
                },
                processRelations = new
                {
                    table = "ProcessRelations",
                    required = new[] { "sourceProcessType", "sourceProcessId", "targetProcessType", "targetProcessId", "relationshipType" },
                    fields = new[] { "id", "sourceProcessType", "sourceProcessId", "targetProcessType", "targetProcessId", "relationshipType", "notes" }
                },
                participation = new
                {
                    table = "ParticipationSubmissions",
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
                editorial = await dbContext.EditorialItems.CountAsync(cancellationToken),
                festivals = await dbContext.FestivalRecords.CountAsync(cancellationToken),
                musicMarkets = await dbContext.MarketRecords.CountAsync(cancellationToken),
                musicSchools = await dbContext.SchoolRecords.CountAsync(cancellationToken),
                organizations = await dbContext.Organizations.CountAsync(cancellationToken),
                spacesInfrastructure = await dbContext.SpacesInfrastructure.CountAsync(cancellationToken),
                divipola = await dbContext.DivipolaLocations.CountAsync(cancellationToken),
                processEntityRelations = await dbContext.ProcessEntityRelations.CountAsync(cancellationToken),
                processRelations = await dbContext.ProcessRelations.CountAsync(cancellationToken),
                participation = await dbContext.ParticipationSubmissions.CountAsync(cancellationToken),
                users = await dbContext.Users.CountAsync(cancellationToken),
                statuses = await dbContext.ContentStatuses.CountAsync(cancellationToken)
            };

            return Results.Ok(stats);
        });

        admin.MapPost("/agenda/events", async (
            AgendaEventUpsertRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
            var departmentCode = await ResolveDepartmentCodeAsync(dbContext, request.Department, cancellationToken);
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["department"] = ["Department is required and must exist in DivipolaLocations."] });
            }

            var municipalityCode = await ResolveMunicipalityCodeAsync(dbContext, departmentCode, request.Municipality, cancellationToken);
            var categoryId = await ResolveCategoryIdAsync(dbContext, "agenda", request.Category, cancellationToken);
            var eventDate = ParseDateOrDefault(request.Date, DateTime.UtcNow.Date);
            var eventTime = ParseTimeOrNull(request.TimeLabel);

            var existing = await FindAgendaEventAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new AgendaEventRow();

            row.Title = request.Title.Trim();
            row.Description = request.Description?.Trim();
            row.ShortDescription = request.Description?.Trim();
            row.CategoryId = categoryId;
            row.StartDate = eventDate;
            row.EndDate = null;
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.SpecificLocation = request.Location?.Trim();
            row.OrganizationName = request.Organizer?.Trim();
            row.MoreInfoUrl = request.ImageUrl?.Trim();
            row.StatusId = defaultStatusId;
            row.StartTime = eventTime;

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
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.CategoryId = categoryId;
            row.PublishedDate = publishedDate;
            row.UpdatedDate = DateTime.UtcNow.Date;
            row.PrimaryExternalUrl = request.ImageUrl?.Trim();
            row.PrimaryEmbedUrl = string.Empty;
            row.SlugPrimary = BuildSlug(request.Title);
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
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.StatusId = defaultStatusId;
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
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.StudentsTotal = Math.Max(0, request.Students);
            row.ActiveGroupsCount = Math.Max(0, request.ActiveGroupsCount > 0 ? request.ActiveGroupsCount : request.Teachers);
            row.IsActiveSchool = true;
            row.StatusId = defaultStatusId;

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
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.Periodicity = request.Periodicity?.Trim();
            row.EditionsCount = request.EditionsCount > 0
                ? request.EditionsCount
                : (request.AverageProjects > 0 ? request.AverageProjects : row.EditionsCount);
            row.HasCurrentYearEdition = false;
            row.AssociatedFestivalDisplayName = request.AssociatedFestivalDisplayName?.Trim();
            row.HasAssociatedFestival = !ValidationHelpers.IsMissing(row.AssociatedFestivalDisplayName);
            row.HasRegisteredResponsibleEntity = false;
            row.Description = BuildMarketOperationalNotes(request.AverageProjects, request.AverageBuyers);
            row.StatusId = defaultStatusId;

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

        admin.MapPost("/editorial/resources", async (
            EditorialResourceUpsertRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Title is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
            var categoryId = await ResolveCategoryIdAsync(dbContext, "editorial", request.Category, cancellationToken);

            var existing = await FindEditorialItemAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new EditorialItemRow();

            row.Title = request.Title.Trim();
            row.ShortDescription = request.Summary?.Trim();
            row.Content = request.Summary?.Trim();
            row.CategoryId = categoryId;
            row.StatusId = defaultStatusId;

            if (isNew)
            {
                row.CreatedByUserId = createdByUserId;
                row.CreatedAt = DateTime.UtcNow;
                dbContext.EditorialItems.Add(row);
            }
            else
            {
                row.UpdatedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var classification = await dbContext.EditorialClassifications
                .FirstOrDefaultAsync(item => item.EditorialItemId == row.Id, cancellationToken);
            if (classification is null)
            {
                classification = new EditorialClassificationRow
                {
                    EditorialItemId = row.Id
                };
                dbContext.EditorialClassifications.Add(classification);
            }

            classification.MainSection = request.Section?.Trim();
            classification.SectionPath = request.SectionPath?.Trim();

            var bibliographic = await dbContext.EditorialBibliographicRecords
                .FirstOrDefaultAsync(item => item.EditorialItemId == row.Id, cancellationToken);
            if (bibliographic is null)
            {
                bibliographic = new EditorialBibliographicRecordRow
                {
                    EditorialItemId = row.Id
                };
                dbContext.EditorialBibliographicRecords.Add(bibliographic);
            }

            var parsedYear = ParseYearOrNull(request.Year);
            bibliographic.YearFrom = parsedYear;
            bibliographic.YearTo = parsedYear;
            bibliographic.PublicationType = request.PublicationType?.Trim();
            bibliographic.MainAuthors = request.Author?.Trim();
            bibliographic.CorporateAuthor = request.CorporateAuthor?.Trim();
            bibliographic.Keywords = JoinKeywords(request.Keywords);

            var availability = await dbContext.EditorialAvailabilities
                .FirstOrDefaultAsync(item => item.EditorialItemId == row.Id, cancellationToken);
            if (availability is null)
            {
                availability = new EditorialAvailabilityRow
                {
                    EditorialItemId = row.Id
                };
                dbContext.EditorialAvailabilities.Add(availability);
            }

            availability.ResourceUrl = request.Url?.Trim();
            availability.AccessType = string.IsNullOrWhiteSpace(availability.AccessType) ? "public" : availability.AccessType;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new { id = row.Id });
        });

        admin.MapPost("/organizations", async (
            OrganizationUpsertRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.OrganizationType = request.OrganizationType?.Trim();
            row.TerritorialScope = request.TerritorialScope?.Trim();
            row.ContactEmail = request.ContactEmail?.Trim();
            row.ContactPhone = request.ContactPhone?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.StatusId = defaultStatusId;

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
            CancellationToken cancellationToken) =>
        {
            if (ValidationHelpers.IsMissing(request.Name))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Name is required."] });
            }

            var defaultStatusId = await ResolveDefaultStatusIdAsync(dbContext, cancellationToken);
            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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
            row.DepartmentCode = departmentCode;
            row.MunicipalityCode = municipalityCode;
            row.CoverageLevel = string.IsNullOrWhiteSpace(municipalityCode) ? "departmental" : "municipal";
            row.ActorType = request.ActorType?.Trim();
            row.PrimaryFunction = request.PrimaryFunction?.Trim();
            row.MaxCapacityApprox = request.MaxCapacityApprox > 0 ? request.MaxCapacityApprox : null;
            row.ContactEmail = request.ContactEmail?.Trim();
            row.ContactPhone = request.ContactPhone?.Trim();
            row.WebsiteUrl = request.WebsiteUrl?.Trim();
            row.StatusId = defaultStatusId;

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

            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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

            var createdByUserId = await EnsureSystemUserAsync(dbContext, cancellationToken);
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

        return group;
    }

    private static ValueTask<object?> ValidateAdminApiKeyAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();

        var configuredApiKey = configuration["Security:AdminApiKey"] ?? configuration["PNMC_ADMIN_API_KEY"];
        if (string.IsNullOrWhiteSpace(configuredApiKey))
        {
            if (environment.IsDevelopment() || environment.IsEnvironment("Local") || environment.IsEnvironment("Test"))
            {
                return next(context);
            }

            return ValueTask.FromResult<object?>(Results.Problem(
                title: "Admin API key is not configured.",
                statusCode: StatusCodes.Status503ServiceUnavailable));
        }

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

    private static async Task<int> ResolveDefaultStatusIdAsync(PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var draftStatus = await dbContext.ContentStatuses.AsNoTracking()
            .FirstOrDefaultAsync(status => status.Code == "draft", cancellationToken);

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

    private static async Task<EditorialItemRow?> FindEditorialItemAsync(PnmcDbContext dbContext, string candidateId, CancellationToken cancellationToken)
    {
        if (int.TryParse(candidateId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) && id > 0)
        {
            return await dbContext.EditorialItems.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        }

        return null;
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

    private static string NormalizeText(string value)
    {
        return (value ?? string.Empty)
            .Trim()
            .Normalize(NormalizationForm.FormD)
            .Where(ch => ch <= 127)
            .Aggregate(string.Empty, (current, ch) => current + ch)
            .ToUpperInvariant();
    }
}
