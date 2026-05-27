using System.Globalization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class NotificationEndpoints
{
    private static readonly string[] AllowedChannels = ["internal", "email", "whatsapp"];
    private static readonly string[] AllowedStatuses = ["pendiente", "enviada", "leida", "fallida", "cancelada"];

    public static RouteGroupBuilder MapNotificationEndpoints(this RouteGroupBuilder group)
    {
        var notifications = group.MapGroup("/notifications").WithTags("notifications");

        notifications.MapGet(string.Empty, async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var currentUser = await ResolveCurrentUserAsync(principal, dbContext, cancellationToken);
            if (currentUser is null)
            {
                return Results.Unauthorized();
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var email = NormalizeEmail(currentUser.Email);
            var query = dbContext.Notifications.AsNoTracking()
                .Where(item => item.RecipientUserId == currentUser.Id || item.RecipientEmail == email)
                .OrderByDescending(item => item.CreatedAt);

            var total = await query.CountAsync(cancellationToken);
            var rows = await query.Skip(safeOffset).Take(safeLimit).ToListAsync(cancellationToken);
            return Results.Ok(new PagedResponse<NotificationDto>(rows.Select(ToDto).ToList(), safeLimit, safeOffset, total));
        }).RequireAuthorization();

        notifications.MapPost("/{id:long}/read", async (
            long id,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var currentUser = await ResolveCurrentUserAsync(principal, dbContext, cancellationToken);
            if (currentUser is null)
            {
                return Results.Unauthorized();
            }

            var email = NormalizeEmail(currentUser.Email);
            var row = await dbContext.Notifications.FirstOrDefaultAsync(item =>
                item.Id == id
                && (item.RecipientUserId == currentUser.Id || item.RecipientEmail == email),
                cancellationToken);
            if (row is null)
            {
                return Results.NotFound();
            }

            row.ReadAt ??= DateTime.UtcNow;
            row.Status = "leida";
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(row));
        }).RequireAuthorization();

        var admin = group.MapGroup("/admin/notifications").WithTags("admin-notifications");
        admin.MapPost(string.Empty, async (
            NotificationCreateRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (!CanCreateNotification(principal))
            {
                return Results.Forbid();
            }

            var errors = ValidateCreateRequest(request);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var recipientEmail = NormalizeEmail(request.RecipientEmail);
            var recipient = await dbContext.Users.AsNoTracking()
                .FirstOrDefaultAsync(item => item.Email.ToLower() == recipientEmail, cancellationToken);
            var now = DateTime.UtcNow;
            var channel = Clean(request.Channel);
            var row = new NotificationRow
            {
                RecipientUserId = recipient?.Id,
                RecipientEmail = recipientEmail,
                EventType = ValidationHelpers.SanitizeText(request.EventType, 100),
                Channel = channel,
                Title = ValidationHelpers.SanitizeText(request.Title, 240),
                Body = ValidationHelpers.SanitizeText(request.Body, 2000),
                Status = channel == "internal" ? "enviada" : "pendiente",
                ModuleId = ValidationHelpers.SanitizeText(request.ModuleId, 80),
                RecordId = ValidationHelpers.SanitizeText(request.RecordId, 120),
                MetadataJson = string.IsNullOrWhiteSpace(request.MetadataJson) ? null : request.MetadataJson,
                CreatedAt = now,
                SentAt = channel == "internal" ? now : null,
                Attempts = 0
            };

            dbContext.Notifications.Add(row);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/v1/notifications/{row.Id}", ToDto(row));
        }).RequireAuthorization();

        return group;
    }

    private static Dictionary<string, string[]> ValidateCreateRequest(NotificationCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (!ValidationHelpers.IsValidEmail(request.RecipientEmail))
        {
            errors["recipientEmail"] = ["Indica un correo destinatario valido."];
        }

        if (string.IsNullOrWhiteSpace(request.EventType) || request.EventType.Length > 100)
        {
            errors["eventType"] = ["Indica un tipo de evento claro."];
        }

        if (!AllowedChannels.Contains(Clean(request.Channel)))
        {
            errors["channel"] = ["Canal no valido. Usa internal, email o whatsapp."];
        }

        if (Clean(request.Channel) == "whatsapp")
        {
            errors["channel"] = ["WhatsApp esta preparado como canal futuro, pero aun no tiene proveedor configurado."];
        }

        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 240)
        {
            errors["title"] = ["Indica un titulo de notificacion de maximo 240 caracteres."];
        }

        if (string.IsNullOrWhiteSpace(request.Body) || request.Body.Length > 2000)
        {
            errors["body"] = ["Indica un mensaje de notificacion de maximo 2000 caracteres."];
        }

        return errors;
    }

    private static bool CanCreateNotification(ClaimsPrincipal principal)
    {
        return principal.Identity?.IsAuthenticated == true
            && (principal.IsInRole("webmaster") || principal.IsInRole("gestor_interno"));
    }

    private static async Task<UserRow?> ResolveCurrentUserAsync(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(rawUserId, out var userId))
        {
            return null;
        }

        return await dbContext.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId && item.IsActive, cancellationToken);
    }

    private static NotificationDto ToDto(NotificationRow row)
    {
        return new NotificationDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.RecipientUserId?.ToString(CultureInfo.InvariantCulture),
            row.RecipientEmail ?? string.Empty,
            row.EventType,
            row.Channel,
            row.Title,
            row.Body,
            AllowedStatuses.Contains(row.Status) ? row.Status : "pendiente",
            row.ModuleId ?? string.Empty,
            row.RecordId ?? string.Empty,
            row.CreatedAt,
            row.SentAt,
            row.ReadAt);
    }

    private static string NormalizeEmail(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string Clean(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }
}
