using System.Globalization;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AdminEntityEndpoints
{
    private static readonly Dictionary<string, string> EntityTypeLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["organizacion"] = "Organización",
        ["escuela_musica"] = "Escuela de música",
        ["lutier"] = "Lutier",
        ["festival"] = "Festival",
        ["mercado_musical"] = "Mercado musical",
        ["espacio"] = "Espacio",
        ["colectivo"] = "Colectivo",
        ["individuo"] = "Individuo"
    };

    private static readonly Dictionary<string, string> StatusLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["borrador"] = "Borrador",
        ["en_revision"] = "En revisión",
        ["aprobado"] = "Aprobado",
        ["publicado"] = "Publicado",
        ["archivado"] = "Archivado",
        ["rechazado"] = "Rechazado"
    };

    private static readonly HashSet<string> EntityTypes = new(EntityTypeLabels.Keys, StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> Statuses = new(StatusLabels.Keys, StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> SourceTables = new(StringComparer.OrdinalIgnoreCase)
    {
        "Festivales",
        "EscuelasMusica",
        "MercadosMusicales",
        "RedesDocumentacion",
        "Lutieres"
    };

    public static RouteGroupBuilder MapAdminEntityEndpoints(this RouteGroupBuilder group)
    {
        var entities = group.MapGroup("/admin/entities").WithTags("admin-entities");
        entities.RequireAuthorization();

        entities.MapGet("/", async (
            PnmcDbContext dbContext,
            ClaimsPrincipal principal,
            string? entityType,
            string? status,
            string? q,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var query = dbContext.EntityProfiles.AsNoTracking().Where(item => item.IsActive);
            if (!UserIsWebmasterOrEditor(principal))
            {
                var currentUserId = GetCurrentUserId(principal);
                query = query.Where(item => item.CreatedByUserId == currentUserId
                    || item.ResponsibleUserId == currentUserId
                    || dbContext.UserEntities.Any(link => link.EntityId == item.Id && link.UserId == currentUserId && link.IsActive));
            }

            if (!ValidationHelpers.IsMissing(entityType))
            {
                var normalizedType = Normalize(entityType ?? string.Empty);
                query = query.Where(item => item.EntityType == normalizedType);
            }

            if (!ValidationHelpers.IsMissing(status))
            {
                var normalizedStatus = NormalizeStatus(status ?? string.Empty);
                query = query.Where(item => item.StatusCode == normalizedStatus);
            }

            if (!ValidationHelpers.IsMissing(q))
            {
                var term = q?.Trim() ?? string.Empty;
                query = query.Where(item => item.Name.Contains(term) || (item.ContactEmail != null && item.ContactEmail.Contains(term)));
            }

            var total = await query.CountAsync(cancellationToken);
            var rows = await query
                .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                .ThenBy(item => item.Name)
                .Skip(Math.Max(0, offset ?? 0))
                .Take(Math.Clamp(limit ?? 50, 1, 200))
                .ToListAsync(cancellationToken);

            var mapped = await MapSummariesAsync(dbContext, rows, cancellationToken);
            return Results.Ok(new PagedResponse<AdminEntitySummaryDto>(mapped, Math.Clamp(limit ?? 50, 1, 200), Math.Max(0, offset ?? 0), total));
        });

        entities.MapGet("/{id:int}", async (int id, PnmcDbContext dbContext, ClaimsPrincipal principal, CancellationToken cancellationToken) =>
        {
            var row = await dbContext.EntityProfiles.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (row is null)
            {
                return Results.NotFound();
            }

            if (!await CanAccessEntityAsync(dbContext, principal, id, cancellationToken))
            {
                return Results.Forbid();
            }

            var summary = (await MapSummariesAsync(dbContext, [row], cancellationToken)).Single();
            var relations = await LoadRelationsAsync(dbContext, id, cancellationToken);
            var sourceRecords = await dbContext.EntitySourceRecords.AsNoTracking()
                .Where(item => item.EntityId == id)
                .OrderByDescending(item => item.IsPrimary)
                .Select(item => new AdminEntitySourceRecordDto(
                    item.Id.ToString(),
                    item.EntityId.ToString(),
                    item.SourceTable,
                    item.SourceRecordId.ToString(),
                    item.EcosystemRecordId == null ? null : item.EcosystemRecordId.Value.ToString(),
                    item.IsPrimary))
                .ToListAsync(cancellationToken);
            var historyRows = await dbContext.EntityReviewHistory.AsNoTracking()
                .Where(item => item.EntityId == id)
                .OrderByDescending(item => item.CreatedAt)
                .Join(
                    dbContext.Users.AsNoTracking(),
                    history => history.UserId,
                    user => user.Id,
                    (history, user) => new AdminEntityReviewEventDto(
                        history.Id.ToString(),
                        history.Action,
                        history.Comment ?? string.Empty,
                        user.FullName,
                        history.CreatedAt))
                .ToListAsync(cancellationToken);

            return Results.Ok(new AdminEntityDetailDto(summary, relations, sourceRecords, historyRows));
        });

        entities.MapPost("/", async (
            AdminEntityUpsertRequest request,
            PnmcDbContext dbContext,
            ClaimsPrincipal principal,
            CancellationToken cancellationToken) =>
        {
            var errors = ValidateEntityRequest(request);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var currentUserId = GetCurrentUserId(principal);
            var existing = await FindEntityAsync(dbContext, request.Id, cancellationToken);
            var isNew = existing is null;
            var row = existing ?? new EntityProfileRow
            {
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = currentUserId
            };

            if (!isNew && !await CanAccessEntityAsync(dbContext, principal, row.Id, cancellationToken))
            {
                return Results.Forbid();
            }

            var territory = await ResolveTerritoryAsync(dbContext, request.CoverageLevel, request.Department, request.Municipality, cancellationToken);
            if (!territory.IsValid)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["territory"] = [territory.Error] });
            }

            row.EntityType = Normalize(request.EntityType);
            row.Name = request.Name.Trim();
            row.LegalName = TrimOrNull(request.LegalName);
            row.Description = TrimOrNull(request.Description);
            row.ContactEmail = TrimOrNull(request.ContactEmail);
            row.ContactPhone = TrimOrNull(request.ContactPhone);
            row.WebsiteUrl = TrimOrNull(request.WebsiteUrl);
            row.FacebookUrl = TrimOrNull(request.FacebookUrl);
            row.InstagramUrl = TrimOrNull(request.InstagramUrl);
            row.OtherUrl = TrimOrNull(request.OtherUrl);
            row.CoverageLevel = NormalizeCoverage(request.CoverageLevel);
            row.DepartmentCode = territory.DepartmentCode;
            row.MunicipalityCode = territory.MunicipalityCode;
            row.AddressText = TrimOrNull(request.AddressText);
            row.Latitude = request.Latitude;
            row.Longitude = request.Longitude;
            row.StatusCode = NormalizeStatus(request.Status);
            row.ResponsibleUserId = int.TryParse(request.ResponsibleUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var responsibleId)
                ? responsibleId
                : currentUserId;
            row.UpdatedAt = DateTime.UtcNow;

            if (isNew)
            {
                dbContext.EntityProfiles.Add(row);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            if (isNew)
            {
                dbContext.UserEntities.Add(new UserEntityRow
                {
                    UserId = currentUserId,
                    EntityId = row.Id,
                    EntityRole = "propietario",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await AddHistoryAsync(dbContext, row.Id, currentUserId, isNew ? "crear" : "actualizar", null, cancellationToken);
            var summary = (await MapSummariesAsync(dbContext, [row], cancellationToken)).Single();
            return Results.Ok(summary);
        });

        entities.MapPost("/{id:int}/status", async (
            int id,
            AdminEntityStatusRequest request,
            PnmcDbContext dbContext,
            ClaimsPrincipal principal,
            CancellationToken cancellationToken) =>
        {
            if (!await CanAccessEntityAsync(dbContext, principal, id, cancellationToken))
            {
                return Results.Forbid();
            }

            var row = await dbContext.EntityProfiles.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (row is null)
            {
                return Results.NotFound();
            }

            var nextStatus = NormalizeStatus(request.Status);
            if (!Statuses.Contains(nextStatus))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Estado no valido."] });
            }

            if ((nextStatus is "aprobado" or "publicado") && !UserIsWebmasterOrEditor(principal))
            {
                return Results.Forbid();
            }

            row.StatusCode = nextStatus;
            row.UpdatedAt = DateTime.UtcNow;
            row.ReviewedAt = nextStatus is "en_revision" or "aprobado" or "rechazado" ? DateTime.UtcNow : row.ReviewedAt;
            row.ApprovedAt = nextStatus is "aprobado" or "publicado" ? DateTime.UtcNow : row.ApprovedAt;
            row.PublishedAt = nextStatus == "publicado" ? DateTime.UtcNow : row.PublishedAt;
            await AddHistoryAsync(dbContext, row.Id, GetCurrentUserId(principal), ActionForStatus(nextStatus), request.Comment, cancellationToken);

            var summary = (await MapSummariesAsync(dbContext, [row], cancellationToken)).Single();
            return Results.Ok(summary);
        });

        entities.MapPost("/{id:int}/relations", async (
            int id,
            AdminEntityRelationRequest request,
            PnmcDbContext dbContext,
            ClaimsPrincipal principal,
            CancellationToken cancellationToken) =>
        {
            if (!await CanAccessEntityAsync(dbContext, principal, id, cancellationToken))
            {
                return Results.Forbid();
            }

            if (!int.TryParse(request.TargetEntityId, out var targetId) || targetId <= 0 || id == targetId)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["targetEntityId"] = ["Entidad destino no valida."] });
            }

            var targetExists = await dbContext.EntityProfiles.AnyAsync(item => item.Id == targetId, cancellationToken);
            if (!targetExists)
            {
                return Results.NotFound();
            }

            var relationType = Normalize(request.RelationshipType);
            var existing = await dbContext.EntityRelations.FirstOrDefaultAsync(
                item => item.SourceEntityId == id && item.TargetEntityId == targetId && item.RelationshipType == relationType,
                cancellationToken);
            if (existing is null)
            {
                dbContext.EntityRelations.Add(new EntityRelationRow
                {
                    SourceEntityId = id,
                    TargetEntityId = targetId,
                    RelationshipType = relationType,
                    Notes = TrimOrNull(request.Notes),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.Notes = TrimOrNull(request.Notes);
                existing.IsActive = true;
            }

            await AddHistoryAsync(dbContext, id, GetCurrentUserId(principal), "actualizar", "Relacion de entidad actualizada.", cancellationToken);
            return Results.Ok(await LoadRelationsAsync(dbContext, id, cancellationToken));
        });

        entities.MapPost("/{id:int}/source-records", async (
            int id,
            AdminEntitySourceRecordRequest request,
            PnmcDbContext dbContext,
            ClaimsPrincipal principal,
            CancellationToken cancellationToken) =>
        {
            if (!await CanAccessEntityAsync(dbContext, principal, id, cancellationToken))
            {
                return Results.Forbid();
            }

            if (!SourceTables.Contains(request.SourceTable)
                || !int.TryParse(request.SourceRecordId, out var sourceRecordId)
                || sourceRecordId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { ["source"] = ["Tabla fuente o ID fuente no valido."] });
            }

            var ecosystemId = int.TryParse(request.EcosystemRecordId, out var parsedEcosystemId) ? parsedEcosystemId : (int?)null;
            var existing = await dbContext.EntitySourceRecords.FirstOrDefaultAsync(
                item => item.SourceTable == request.SourceTable && item.SourceRecordId == sourceRecordId,
                cancellationToken);
            if (existing is null)
            {
                dbContext.EntitySourceRecords.Add(new EntitySourceRecordRow
                {
                    EntityId = id,
                    SourceTable = request.SourceTable,
                    SourceRecordId = sourceRecordId,
                    EcosystemRecordId = ecosystemId,
                    IsPrimary = request.IsPrimary,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.EntityId = id;
                existing.EcosystemRecordId = ecosystemId;
                existing.IsPrimary = request.IsPrimary;
            }

            await AddHistoryAsync(dbContext, id, GetCurrentUserId(principal), "actualizar", "Registro fuente vinculado.", cancellationToken);
            return Results.Ok();
        });

        return group;
    }

    private static Dictionary<string, string[]> ValidateEntityRequest(AdminEntityUpsertRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (!EntityTypes.Contains(Normalize(request.EntityType)))
        {
            errors["entityType"] = ["Tipo de entidad no valido."];
        }

        if (ValidationHelpers.IsMissing(request.Name))
        {
            errors["name"] = ["Nombre es obligatorio."];
        }

        if (!Statuses.Contains(NormalizeStatus(request.Status)))
        {
            errors["status"] = ["Estado no valido."];
        }

        return errors;
    }

    private static async Task<EntityProfileRow?> FindEntityAsync(PnmcDbContext dbContext, string id, CancellationToken cancellationToken)
    {
        return int.TryParse(id, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedId) && parsedId > 0
            ? await dbContext.EntityProfiles.FirstOrDefaultAsync(item => item.Id == parsedId, cancellationToken)
            : null;
    }

    private static async Task<IReadOnlyList<AdminEntitySummaryDto>> MapSummariesAsync(
        PnmcDbContext dbContext,
        IReadOnlyList<EntityProfileRow> rows,
        CancellationToken cancellationToken)
    {
        var departments = await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(item => item.DepartmentCode)
            .ToDictionaryAsync(group => group.Key, group => group.First().DepartmentName, cancellationToken);
        var municipalities = await dbContext.DivipolaLocations.AsNoTracking()
            .ToDictionaryAsync(item => item.MunicipalityCode, item => item.MunicipalityName, cancellationToken);
        var users = await dbContext.Users.AsNoTracking()
            .ToDictionaryAsync(item => item.Id, item => item.FullName, cancellationToken);

        return rows.Select(row => new AdminEntitySummaryDto(
            row.Id.ToString(),
            row.EntityType,
            EntityTypeLabels.GetValueOrDefault(row.EntityType, row.EntityType),
            row.Name,
            row.LegalName ?? string.Empty,
            row.ContactEmail ?? string.Empty,
            row.ContactPhone ?? string.Empty,
            row.DepartmentCode ?? string.Empty,
            row.DepartmentCode is not null && departments.TryGetValue(row.DepartmentCode, out var departmentName) ? departmentName : string.Empty,
            row.MunicipalityCode ?? string.Empty,
            row.MunicipalityCode is not null && municipalities.TryGetValue(row.MunicipalityCode, out var municipalityName) ? municipalityName : string.Empty,
            row.StatusCode,
            StatusLabels.GetValueOrDefault(row.StatusCode, row.StatusCode),
            row.IsActive,
            row.ResponsibleUserId is not null && users.TryGetValue(row.ResponsibleUserId.Value, out var userName) ? userName : string.Empty,
            row.CreatedAt,
            row.UpdatedAt)).ToList();
    }

    private static async Task<IReadOnlyList<AdminEntityRelationDto>> LoadRelationsAsync(
        PnmcDbContext dbContext,
        int entityId,
        CancellationToken cancellationToken)
    {
        return await dbContext.EntityRelations.AsNoTracking()
            .Where(item => item.SourceEntityId == entityId && item.IsActive)
            .Join(
                dbContext.EntityProfiles.AsNoTracking(),
                relation => relation.TargetEntityId,
                target => target.Id,
                (relation, target) => new AdminEntityRelationDto(
                    relation.Id.ToString(),
                    relation.SourceEntityId.ToString(),
                    relation.TargetEntityId.ToString(),
                    target.Name,
                    relation.RelationshipType,
                    relation.Notes ?? string.Empty))
            .OrderBy(item => item.TargetEntityName)
            .ToListAsync(cancellationToken);
    }

    private static async Task<bool> CanAccessEntityAsync(
        PnmcDbContext dbContext,
        ClaimsPrincipal principal,
        int entityId,
        CancellationToken cancellationToken)
    {
        if (UserIsWebmasterOrEditor(principal))
        {
            return true;
        }

        var currentUserId = GetCurrentUserId(principal);
        return await dbContext.EntityProfiles.AsNoTracking()
            .AnyAsync(item => item.Id == entityId && (item.CreatedByUserId == currentUserId || item.ResponsibleUserId == currentUserId), cancellationToken)
            || await dbContext.UserEntities.AsNoTracking()
                .AnyAsync(item => item.EntityId == entityId && item.UserId == currentUserId && item.IsActive, cancellationToken);
    }

    private static async Task<(bool IsValid, string? DepartmentCode, string? MunicipalityCode, string Error)> ResolveTerritoryAsync(
        PnmcDbContext dbContext,
        string coverageLevel,
        string department,
        string municipality,
        CancellationToken cancellationToken)
    {
        var normalizedCoverage = NormalizeCoverage(coverageLevel);
        if (normalizedCoverage == "nacional")
        {
            return (true, null, null, string.Empty);
        }

        var locations = await dbContext.DivipolaLocations.AsNoTracking().ToListAsync(cancellationToken);
        var normalizedDepartment = NormalizeText(department);
        var normalizedMunicipality = NormalizeText(municipality);
        var departmentRow = locations.FirstOrDefault(item =>
            NormalizeText(item.DepartmentName) == normalizedDepartment
            || NormalizeText(item.DepartmentCode) == normalizedDepartment);
        if (departmentRow is null)
        {
            return (false, null, null, "Departamento requerido o no encontrado.");
        }

        if (normalizedCoverage == "departamental")
        {
            return (true, departmentRow.DepartmentCode, null, string.Empty);
        }

        var municipalityRow = locations.FirstOrDefault(item => item.DepartmentCode == departmentRow.DepartmentCode
            && (NormalizeText(item.MunicipalityName) == normalizedMunicipality
                || NormalizeText(item.MunicipalityCode) == normalizedMunicipality));
        if (municipalityRow is null)
        {
            return (false, null, null, "Municipio requerido o no encontrado.");
        }

        return (true, municipalityRow.DepartmentCode, municipalityRow.MunicipalityCode, string.Empty);
    }

    private static async Task AddHistoryAsync(
        PnmcDbContext dbContext,
        int entityId,
        int userId,
        string action,
        string? comment,
        CancellationToken cancellationToken)
    {
        dbContext.EntityReviewHistory.Add(new EntityReviewHistoryRow
        {
            EntityId = entityId,
            UserId = userId,
            Action = action,
            Comment = TrimOrNull(comment),
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
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

    private static bool UserIsWebmasterOrEditor(ClaimsPrincipal principal)
    {
        return principal.IsInRole("webmaster")
            || principal.IsInRole("gestor_interno");
    }

    private static int GetCurrentUserId(ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(rawUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId) ? userId : 0;
    }

    private static string Normalize(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string NormalizeText(string value)
    {
        var normalized = Normalize(value).Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static string NormalizeCoverage(string value)
    {
        var normalized = Normalize(value);
        return string.IsNullOrWhiteSpace(normalized) ? "municipal" : normalized;
    }

    private static string NormalizeStatus(string value)
    {
        var normalized = Normalize(value);
        return normalized switch
        {
            "draft" => "borrador",
            "review" => "en_revision",
            "approved" => "aprobado",
            "published" => "publicado",
            _ => string.IsNullOrWhiteSpace(normalized) ? "borrador" : normalized
        };
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
