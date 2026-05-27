using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AdminAllyEndpoints
{
    private static readonly PasswordHasher<UserRow> PasswordHasher = new();
    private static readonly string[] AllowedStatuses = ["pendiente", "en_revision", "ajustes_solicitados", "aprobada", "rechazada", "cancelada"];

    public static RouteGroupBuilder MapAdminAllyEndpoints(this RouteGroupBuilder group)
    {
        var admin = group.MapGroup("/admin/ally-requests").WithTags("admin-ally-requests");

        admin.MapGet(string.Empty, async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IHostEnvironment environment,
            string? status,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            if (!CanReviewAllies(principal, environment))
            {
                return Results.Forbid();
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var query = dbContext.AllyRequests.AsNoTracking().OrderByDescending(item => item.UpdatedAt).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusCode = Clean(status);
                query = query.Where(item => item.Status == statusCode);
            }

            var total = await query.CountAsync(cancellationToken);
            var items = await query.Skip(safeOffset).Take(safeLimit).ToListAsync(cancellationToken);
            return Results.Ok(new PagedResponse<AdminAllyRequestDto>(
                items.Select(ToDto).ToList(),
                safeLimit,
                safeOffset,
                total));
        });

        admin.MapPost(string.Empty, async (
            AdminAllyRequestCreateRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var errors = ValidateCreateRequest(request);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var adminEmail = NormalizeEmail(request.AdminEmail);
            var institutionalEmail = NormalizeEmail(request.InstitutionalEmail);
            var existing = await dbContext.AllyRequests.AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.AdminEmail == adminEmail
                    && item.EntityName == request.EntityName.Trim()
                    && item.Status != "cancelada"
                    && item.Status != "rechazada",
                    cancellationToken);
            if (existing is not null)
            {
                return Results.Conflict(new { message = "Ya existe una solicitud activa para esta entidad y correo administrador." });
            }

            var now = DateTime.UtcNow;
            var row = new AllyRequestRow
            {
                EntityName = ValidationHelpers.SanitizeText(request.EntityName, 240),
                EntityType = ValidationHelpers.SanitizeText(request.EntityType, 120),
                Nit = ValidationHelpers.SanitizeText(request.Nit, 80),
                DepartmentCode = ValidationHelpers.SanitizeText(request.DepartmentCode, 10),
                MunicipalityCode = ValidationHelpers.SanitizeText(request.MunicipalityCode, 10),
                InstitutionalEmail = institutionalEmail,
                InstitutionalPhone = ValidationHelpers.SanitizeText(request.InstitutionalPhone, 80),
                AdminName = ValidationHelpers.SanitizeText(request.AdminName, 240),
                AdminEmail = adminEmail,
                Status = "pendiente",
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.AllyRequests.Add(row);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/v1/admin/ally-requests/{row.Id}", ToDto(row));
        });

        admin.MapPost("/{id:long}/status", async (
            long id,
            AdminAllyRequestStatusRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            if (!CanReviewAllies(principal, environment))
            {
                return Results.Forbid();
            }

            var targetStatus = Clean(request.Status);
            if (!AllowedStatuses.Contains(targetStatus))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["status"] = ["Estado de solicitud de aliado no valido."]
                });
            }

            var row = await dbContext.AllyRequests.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (row is null)
            {
                return Results.NotFound();
            }

            if (!CanTransition(row.Status, targetStatus))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["status"] = ["La transicion solicitada no es valida para la solicitud de aliado."]
                });
            }

            var previousStatus = row.Status;
            var actingUserId = GetCurrentUserId(principal);
            var now = DateTime.UtcNow;
            row.Status = targetStatus;
            row.ReviewComment = ValidationHelpers.SanitizeText(request.Comment, 1200);
            row.ReviewerUserId = actingUserId;
            row.UpdatedAt = now;

            if (targetStatus == "aprobada" && row.AllyEntityId is null)
            {
                row.AllyEntityId = await ApproveAllyAsync(dbContext, row, actingUserId, now, cancellationToken);
            }

            await WriteAuditAsync(dbContext, actingUserId, "SolicitudesAliado", row.Id.ToString(CultureInfo.InvariantCulture), ActionForStatus(targetStatus), new
            {
                previousStatus,
                nextStatus = targetStatus,
                row.EntityName,
                row.AdminEmail,
                row.AllyEntityId
            }, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(row));
        });

        return group;
    }

    private static Dictionary<string, string[]> ValidateCreateRequest(AdminAllyRequestCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (ValidationHelpers.IsMissing(request.EntityName)) errors["entityName"] = ["Nombre de entidad es obligatorio."];
        if (ValidationHelpers.IsMissing(request.AdminName)) errors["adminName"] = ["Nombre del administrador es obligatorio."];
        if (!ValidationHelpers.IsValidEmail(request.AdminEmail)) errors["adminEmail"] = ["Correo del administrador no es valido."];
        if (!ValidationHelpers.IsValidEmail(request.InstitutionalEmail)) errors["institutionalEmail"] = ["Correo institucional no es valido."];
        if (ValidationHelpers.IsMissing(request.DepartmentCode)) errors["departmentCode"] = ["Codigo de departamento es obligatorio."];
        if (ValidationHelpers.IsMissing(request.MunicipalityCode)) errors["municipalityCode"] = ["Codigo de municipio es obligatorio."];
        return errors;
    }

    private static async Task<int> ApproveAllyAsync(
        PnmcDbContext dbContext,
        AllyRequestRow request,
        int? actingUserId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var entity = new AllyEntityRow
        {
            Name = request.EntityName,
            EntityType = request.EntityType,
            Nit = request.Nit,
            DepartmentCode = request.DepartmentCode,
            MunicipalityCode = request.MunicipalityCode,
            InstitutionalEmail = request.InstitutionalEmail,
            InstitutionalPhone = request.InstitutionalPhone,
            Status = "activa",
            CreatedByUserId = actingUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.AllyEntities.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        var role = await dbContext.Roles.FirstOrDefaultAsync(item => item.Name == "aliado_admin", cancellationToken)
            ?? throw new InvalidOperationException("No existe el rol aliado_admin.");
        var adminEmail = NormalizeEmail(request.AdminEmail);
        var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == adminEmail, cancellationToken);
        if (user is null)
        {
            user = new UserRow
            {
                FullName = request.AdminName,
                Email = adminEmail,
                RoleId = role.Id,
                AccessChannel = "aliado",
                ProfileType = "organizacion",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            user.PasswordHash = PasswordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            user.FullName = string.IsNullOrWhiteSpace(user.FullName) ? request.AdminName : user.FullName;
            user.RoleId = role.Id;
            user.AccessChannel = "aliado";
            user.ProfileType ??= "organizacion";
            user.IsActive = true;
            user.UpdatedAt = now;
        }

        var linkExists = await dbContext.AllyUserLinks.AnyAsync(item =>
            item.UserId == user.Id && item.AllyEntityId == entity.Id,
            cancellationToken);
        if (!linkExists)
        {
            dbContext.AllyUserLinks.Add(new AllyUserLinkRow
            {
                UserId = user.Id,
                AllyEntityId = entity.Id,
                AllyRole = "aliado_admin",
                AllyAdminId = user.Id,
                Status = "activo",
                IsActive = true,
                LinkedAt = now,
                CreatedByUserId = actingUserId
            });
        }

        return entity.Id;
    }

    private static bool CanTransition(string currentStatus, string targetStatus)
    {
        return currentStatus switch
        {
            "pendiente" => targetStatus is "en_revision" or "ajustes_solicitados" or "aprobada" or "rechazada" or "cancelada",
            "en_revision" => targetStatus is "ajustes_solicitados" or "aprobada" or "rechazada",
            "ajustes_solicitados" => targetStatus is "en_revision" or "rechazada" or "cancelada",
            _ => false
        };
    }

    private static string ActionForStatus(string status)
    {
        return status switch
        {
            "en_revision" => "revisar_solicitud_aliado",
            "ajustes_solicitados" => "solicitar_ajustes_aliado",
            "aprobada" => "aprobar_solicitud_aliado",
            "rechazada" => "rechazar_solicitud_aliado",
            "cancelada" => "cancelar_solicitud_aliado",
            _ => "actualizar_solicitud_aliado"
        };
    }

    private static AdminAllyRequestDto ToDto(AllyRequestRow row)
    {
        return new AdminAllyRequestDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.EntityName,
            row.EntityType ?? string.Empty,
            row.Nit ?? string.Empty,
            row.DepartmentCode ?? string.Empty,
            row.MunicipalityCode ?? string.Empty,
            row.InstitutionalEmail,
            row.InstitutionalPhone ?? string.Empty,
            row.AdminName,
            row.AdminEmail,
            row.Status,
            row.ReviewComment ?? string.Empty,
            row.AllyEntityId?.ToString(CultureInfo.InvariantCulture),
            row.CreatedAt,
            row.UpdatedAt);
    }

    private static bool CanReviewAllies(ClaimsPrincipal principal, IHostEnvironment environment)
    {
        if (environment.IsEnvironment("Test"))
        {
            return true;
        }

        return principal.Identity?.IsAuthenticated == true
            && (principal.IsInRole("webmaster") || principal.IsInRole("gestor_interno"));
    }

    private static int? GetCurrentUserId(ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(rawUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId) ? userId : null;
    }

    private static string NormalizeEmail(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string Clean(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static async Task WriteAuditAsync(
        PnmcDbContext dbContext,
        int? userId,
        string tableName,
        string recordId,
        string action,
        object values,
        CancellationToken cancellationToken)
    {
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = userId,
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            NewValuesJson = JsonSerializer.Serialize(values),
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
