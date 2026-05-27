using System.Globalization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class RecordGovernanceEndpoints
{
    private static readonly string[] LinkStatuses = ["pendiente", "en_revision", "ajustes_solicitados", "aprobada", "rechazada", "cancelada"];
    private static readonly string[] DuplicateLevels = ["alta", "media", "baja"];
    private static readonly string[] DuplicateDecisions = ["fusionar", "mantener_separados", "no_duplicado", "pendiente"];
    private static readonly string[] FlagSeverities = ["baja", "media", "alta"];
    private static readonly string[] FlagStatuses = ["abierta", "en_revision", "resuelta", "descartada"];

    public static RouteGroupBuilder MapRecordGovernanceEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/record-link-requests", CreateRecordLinkRequest).RequireAuthorization();

        var adminLinkRequests = group.MapGroup("/admin/record-link-requests").WithTags("admin-record-link-requests");
        adminLinkRequests.MapGet(string.Empty, ListRecordLinkRequests).RequireAuthorization();
        adminLinkRequests.MapPost("/{id:long}/status", UpdateRecordLinkRequestStatus).RequireAuthorization();

        var duplicates = group.MapGroup("/admin/duplicates").WithTags("admin-duplicates");
        duplicates.MapGet(string.Empty, ListDuplicateCandidates).RequireAuthorization();
        duplicates.MapPost(string.Empty, CreateDuplicateCandidate).RequireAuthorization();
        duplicates.MapPost("/{id:long}/decision", DecideDuplicateCandidate).RequireAuthorization();

        var quality = group.MapGroup("/admin/data-quality/flags").WithTags("admin-data-quality");
        quality.MapGet(string.Empty, ListQualityFlags).RequireAuthorization();
        quality.MapPost(string.Empty, CreateQualityFlag).RequireAuthorization();
        quality.MapPost("/{id:long}/status", UpdateQualityFlagStatus).RequireAuthorization();

        return group;
    }

    private static async Task<IResult> CreateRecordLinkRequest(
        RecordLinkRequestCreateRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUser = await ResolveCurrentUserAsync(principal, dbContext, cancellationToken);
        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var errors = ValidateLinkCreateRequest(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var role = await ResolveRoleAsync(currentUser.RoleId, dbContext, cancellationToken);
        var allyEntityId = role is "aliado_admin" or "aliado_editor" or "aliado_lector"
            ? await ResolveAllyEntityIdAsync(currentUser.Id, dbContext, cancellationToken)
            : null;

        if (role is "aliado_admin" or "aliado_editor" or "aliado_lector" && allyEntityId is null)
        {
            return Results.BadRequest(new
            {
                message = "No fue posible crear la solicitud porque el usuario aliado no tiene entidad aliada asociada.",
                code = "ALLY_SCOPE_REQUIRED"
            });
        }

        var now = DateTime.UtcNow;
        var row = new RecordLinkRequestRow
        {
            ModuleId = Clean(request.ModuleId),
            RecordId = Clean(request.RecordId),
            RequestingUserId = currentUser.Id,
            AllyEntityId = allyEntityId,
            RequestedScope = Clean(request.RequestedScope) is "editor" ? "editor" : "responsable",
            Reason = ValidationHelpers.SanitizeText(request.Reason, 1200),
            EvidenceText = ValidationHelpers.SanitizeText(request.EvidenceText, 2000),
            Status = "pendiente",
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.RecordLinkRequests.Add(row);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/record-link-requests/{row.Id}", ToDto(row));
    }

    private static async Task<IResult> ListRecordLinkRequests(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        string? status,
        int? limit,
        int? offset,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var query = dbContext.RecordLinkRequests.AsNoTracking().OrderByDescending(item => item.UpdatedAt).AsQueryable();
        var statusCode = Clean(status);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            query = query.Where(item => item.Status == statusCode);
        }

        var (safeLimit, safeOffset) = SafePaging(limit, offset);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip(safeOffset).Take(safeLimit).ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<RecordLinkRequestDto>(rows.Select(ToDto).ToList(), safeLimit, safeOffset, total));
    }

    private static async Task<IResult> UpdateRecordLinkRequestStatus(
        long id,
        RecordLinkRequestStatusRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var status = Clean(request.Status);
        if (!LinkStatuses.Contains(status))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Estado de solicitud de vinculacion no valido."] });
        }

        var row = await dbContext.RecordLinkRequests.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null)
        {
            return Results.NotFound();
        }

        row.Status = status;
        row.ReviewComment = ValidationHelpers.SanitizeText(request.Comment, 1200);
        row.ReviewerUserId = await ResolveCurrentUserIdAsync(principal);
        row.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToDto(row));
    }

    private static async Task<IResult> ListDuplicateCandidates(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        string? status,
        int? limit,
        int? offset,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var query = dbContext.RecordDuplicateCandidates.AsNoTracking().OrderByDescending(item => item.UpdatedAt).AsQueryable();
        var statusCode = Clean(status);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            query = query.Where(item => item.Status == statusCode);
        }

        var (safeLimit, safeOffset) = SafePaging(limit, offset);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip(safeOffset).Take(safeLimit).ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<RecordDuplicateCandidateDto>(rows.Select(ToDto).ToList(), safeLimit, safeOffset, total));
    }

    private static async Task<IResult> CreateDuplicateCandidate(
        RecordDuplicateCandidateCreateRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var errors = ValidateDuplicateCreateRequest(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var now = DateTime.UtcNow;
        var row = new RecordDuplicateCandidateRow
        {
            ModuleId = Clean(request.ModuleId),
            SourceRecordId = Clean(request.SourceRecordId),
            CandidateRecordId = Clean(request.CandidateRecordId),
            SimilarityLevel = Clean(request.SimilarityLevel),
            SimilarityScore = request.SimilarityScore,
            EvidenceJson = string.IsNullOrWhiteSpace(request.EvidenceJson) ? "{}" : request.EvidenceJson,
            Status = "pendiente",
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.RecordDuplicateCandidates.Add(row);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/admin/duplicates/{row.Id}", ToDto(row));
    }

    private static async Task<IResult> DecideDuplicateCandidate(
        long id,
        RecordDuplicateDecisionRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var decision = Clean(request.Decision);
        if (!DuplicateDecisions.Contains(decision))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["decision"] = ["Decision de duplicado no valida."] });
        }

        var row = await dbContext.RecordDuplicateCandidates.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null)
        {
            return Results.NotFound();
        }

        row.Decision = decision;
        row.DecisionComment = ValidationHelpers.SanitizeText(request.Comment, 1200);
        row.ReviewerUserId = await ResolveCurrentUserIdAsync(principal);
        row.Status = decision == "pendiente" ? "pendiente" : "resuelto";
        row.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToDto(row));
    }

    private static async Task<IResult> ListQualityFlags(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        string? status,
        int? limit,
        int? offset,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var query = dbContext.RecordQualityFlags.AsNoTracking().OrderByDescending(item => item.UpdatedAt).AsQueryable();
        var statusCode = Clean(status);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            query = query.Where(item => item.Status == statusCode);
        }

        var (safeLimit, safeOffset) = SafePaging(limit, offset);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip(safeOffset).Take(safeLimit).ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<RecordQualityFlagDto>(rows.Select(ToDto).ToList(), safeLimit, safeOffset, total));
    }

    private static async Task<IResult> CreateQualityFlag(
        RecordQualityFlagCreateRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var errors = ValidateQualityFlagCreateRequest(request);
        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var now = DateTime.UtcNow;
        var row = new RecordQualityFlagRow
        {
            ModuleId = Clean(request.ModuleId),
            RecordId = Clean(request.RecordId),
            FlagType = Clean(request.FlagType),
            Severity = Clean(request.Severity),
            Status = "abierta",
            Detail = ValidationHelpers.SanitizeText(request.Detail, 1200),
            CreatedByUserId = await ResolveCurrentUserIdAsync(principal),
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.RecordQualityFlags.Add(row);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/admin/data-quality/flags/{row.Id}", ToDto(row));
    }

    private static async Task<IResult> UpdateQualityFlagStatus(
        long id,
        RecordQualityFlagStatusRequest request,
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!CanReview(principal))
        {
            return Results.Forbid();
        }

        var status = Clean(request.Status);
        if (!FlagStatuses.Contains(status))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["status"] = ["Estado de bandera de calidad no valido."] });
        }

        var row = await dbContext.RecordQualityFlags.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (row is null)
        {
            return Results.NotFound();
        }

        row.Status = status;
        row.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToDto(row));
    }

    private static Dictionary<string, string[]> ValidateLinkCreateRequest(RecordLinkRequestCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.ModuleId) || request.ModuleId.Length > 80)
        {
            errors["moduleId"] = ["Indica un modulo valido."];
        }

        if (string.IsNullOrWhiteSpace(request.RecordId) || request.RecordId.Length > 120)
        {
            errors["recordId"] = ["Indica el registro que quieres vincular."];
        }

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 1200)
        {
            errors["reason"] = ["Explica brevemente por que solicitas la vinculacion."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateDuplicateCreateRequest(RecordDuplicateCandidateCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.ModuleId) || request.ModuleId.Length > 80)
        {
            errors["moduleId"] = ["Indica un modulo valido."];
        }

        if (string.IsNullOrWhiteSpace(request.SourceRecordId) || request.SourceRecordId.Length > 120)
        {
            errors["sourceRecordId"] = ["Indica el registro origen."];
        }

        if (string.IsNullOrWhiteSpace(request.CandidateRecordId) || request.CandidateRecordId.Length > 120)
        {
            errors["candidateRecordId"] = ["Indica el registro candidato."];
        }

        if (!DuplicateLevels.Contains(Clean(request.SimilarityLevel)))
        {
            errors["similarityLevel"] = ["El nivel de coincidencia debe ser alta, media o baja."];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ValidateQualityFlagCreateRequest(RecordQualityFlagCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.ModuleId) || request.ModuleId.Length > 80)
        {
            errors["moduleId"] = ["Indica un modulo valido."];
        }

        if (string.IsNullOrWhiteSpace(request.RecordId) || request.RecordId.Length > 120)
        {
            errors["recordId"] = ["Indica el registro asociado."];
        }

        if (string.IsNullOrWhiteSpace(request.FlagType) || request.FlagType.Length > 80)
        {
            errors["flagType"] = ["Indica el tipo de alerta de calidad."];
        }

        if (!FlagSeverities.Contains(Clean(request.Severity)))
        {
            errors["severity"] = ["La severidad debe ser baja, media o alta."];
        }

        return errors;
    }

    private static bool CanReview(ClaimsPrincipal principal)
    {
        return principal.Identity?.IsAuthenticated == true
            && (principal.IsInRole("webmaster") || principal.IsInRole("gestor_interno"));
    }

    private static async Task<UserRow?> ResolveCurrentUserAsync(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveCurrentUserIdAsync(principal);
        if (userId is null)
        {
            return null;
        }

        return await dbContext.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId && item.IsActive, cancellationToken);
    }

    private static Task<int?> ResolveCurrentUserIdAsync(ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Task.FromResult<int?>(int.TryParse(rawUserId, out var userId) ? userId : null);
    }

    private static async Task<string> ResolveRoleAsync(int roleId, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        return await dbContext.Roles.AsNoTracking()
            .Where(item => item.Id == roleId)
            .Select(item => item.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
    }

    private static async Task<int?> ResolveAllyEntityIdAsync(int userId, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        return await dbContext.AllyUserLinks.AsNoTracking()
            .Where(item => item.UserId == userId && item.IsActive)
            .Select(item => (int?)item.AllyEntityId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static (int Limit, int Offset) SafePaging(int? limit, int? offset)
    {
        return (Math.Clamp(limit ?? 50, 1, 200), Math.Max(offset ?? 0, 0));
    }

    private static string Clean(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static RecordLinkRequestDto ToDto(RecordLinkRequestRow row)
    {
        return new RecordLinkRequestDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.ModuleId,
            row.RecordId,
            row.RequestingUserId.ToString(CultureInfo.InvariantCulture),
            row.AllyEntityId?.ToString(CultureInfo.InvariantCulture),
            row.RequestedScope,
            row.Reason,
            row.EvidenceText ?? string.Empty,
            row.Status,
            row.ReviewComment ?? string.Empty,
            row.CreatedAt,
            row.UpdatedAt);
    }

    private static RecordDuplicateCandidateDto ToDto(RecordDuplicateCandidateRow row)
    {
        return new RecordDuplicateCandidateDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.ModuleId,
            row.SourceRecordId,
            row.CandidateRecordId,
            row.SimilarityLevel,
            row.SimilarityScore,
            row.EvidenceJson,
            row.Status,
            row.Decision ?? string.Empty,
            row.DecisionComment ?? string.Empty,
            row.CreatedAt,
            row.UpdatedAt);
    }

    private static RecordQualityFlagDto ToDto(RecordQualityFlagRow row)
    {
        return new RecordQualityFlagDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.ModuleId,
            row.RecordId,
            row.FlagType,
            row.Severity,
            row.Status,
            row.Detail ?? string.Empty,
            row.CreatedAt,
            row.UpdatedAt);
    }
}
