using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AllyPortalEndpoints
{
    private static readonly PasswordHasher<UserRow> PasswordHasher = new();
    private static readonly string[] ManageableRoles = ["aliado_editor", "aliado_lector"];

    public static RouteGroupBuilder MapAllyPortalEndpoints(this RouteGroupBuilder group)
    {
        var ally = group.MapGroup("/ally").WithTags("ally-portal");

        ally.MapGet("/users", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var scope = await ResolveAllyScopeAsync(principal, dbContext, cancellationToken);
            if (scope is null)
            {
                return Results.Forbid();
            }

            var rows = await dbContext.AllyUserLinks
                .Where(link => link.AllyEntityId == scope.Entity.Id)
                .Join(
                    dbContext.Users,
                    link => link.UserId,
                    user => user.Id,
                    (link, user) => new { User = user, Link = link })
                .OrderBy(item => item.User.FullName)
                .ToListAsync(cancellationToken);

            return Results.Ok(rows.Select(item => ToDto(item.User, item.Link, scope.Entity)).ToList());
        }).RequireAuthorization();

        ally.MapPost("/users", async (
            AllyPortalUserCreateRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var scope = await ResolveAllyScopeAsync(principal, dbContext, cancellationToken);
            if (scope is null)
            {
                return Results.Forbid();
            }

            var errors = ValidateCreateRequest(request);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var roleName = Clean(request.Role);
            var role = await dbContext.Roles.FirstOrDefaultAsync(item => item.Name.ToLower() == roleName, cancellationToken);
            if (role is null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["role"] = ["El rol aliado solicitado no existe."]
                });
            }

            var email = NormalizeEmail(request.Email);
            var existing = await dbContext.Users.FirstOrDefaultAsync(item => item.Email.ToLower() == email, cancellationToken);
            if (existing is not null)
            {
                var belongsToEntity = await dbContext.AllyUserLinks.AnyAsync(item =>
                    item.UserId == existing.Id
                    && item.AllyEntityId == scope.Entity.Id,
                    cancellationToken);

                if (!belongsToEntity)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["email"] = ["Ya existe un usuario con ese correo fuera de esta entidad aliada."]
                    });
                }
            }

            var now = DateTime.UtcNow;
            var user = existing ?? new UserRow
            {
                CreatedAt = now
            };

            user.FullName = ValidationHelpers.SanitizeText(request.FullName, 240);
            user.Email = email;
            user.RoleId = role.Id;
            user.AccessChannel = "aliado";
            user.IsActive = true;
            user.UpdatedAt = now;
            if (existing is null || !ValidationHelpers.IsMissing(request.Password))
            {
                user.PasswordHash = PasswordHasher.HashPassword(user, request.Password);
            }

            if (existing is null)
            {
                dbContext.Users.Add(user);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var link = await dbContext.AllyUserLinks.FirstOrDefaultAsync(item =>
                item.UserId == user.Id
                && item.AllyEntityId == scope.Entity.Id,
                cancellationToken);
            if (link is null)
            {
                link = new AllyUserLinkRow
                {
                    UserId = user.Id,
                    AllyEntityId = scope.Entity.Id,
                    LinkedAt = now,
                    CreatedByUserId = scope.User.Id
                };
                dbContext.AllyUserLinks.Add(link);
            }

            link.AllyRole = roleName;
            link.AllyAdminId = scope.User.Id;
            link.Status = "activo";
            link.IsActive = true;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/v1/ally/users/{user.Id}", ToDto(user, link, scope.Entity));
        }).RequireAuthorization();

        ally.MapPatch("/users/{id:int}/status", async (
            int id,
            AllyPortalUserStatusRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var scope = await ResolveAllyScopeAsync(principal, dbContext, cancellationToken);
            if (scope is null)
            {
                return Results.Forbid();
            }

            if (id == scope.User.Id)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["user"] = ["No puedes cambiar el estado de tu propia cuenta aliada."]
                });
            }

            var row = await dbContext.AllyUserLinks
                .Where(link => link.AllyEntityId == scope.Entity.Id)
                .Join(
                    dbContext.Users,
                    link => link.UserId,
                    user => user.Id,
                    (link, user) => new { User = user, Link = link })
                .FirstOrDefaultAsync(item => item.User.Id == id, cancellationToken);
            if (row is null)
            {
                return Results.NotFound();
            }

            row.User.IsActive = request.IsActive;
            row.User.UpdatedAt = DateTime.UtcNow;
            row.Link.IsActive = request.IsActive;
            row.Link.Status = request.IsActive ? "activo" : "inactivo";
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToDto(row.User, row.Link, scope.Entity));
        }).RequireAuthorization();

        return group;
    }

    private static Dictionary<string, string[]> ValidateCreateRequest(AllyPortalUserCreateRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (ValidationHelpers.IsMissing(request.FullName))
        {
            errors["fullName"] = ["Indica el nombre completo del usuario aliado."];
        }

        if (!ValidationHelpers.IsValidEmail(request.Email))
        {
            errors["email"] = ["Indica un correo valido para el usuario aliado."];
        }

        if (!ManageableRoles.Contains(Clean(request.Role)))
        {
            errors["role"] = ["Solo puedes crear usuarios aliado_editor o aliado_lector desde tu entidad aliada."];
        }

        if (ValidationHelpers.IsMissing(request.Password) || request.Password.Length < 10)
        {
            errors["password"] = ["La contrasena inicial debe tener minimo 10 caracteres."];
        }

        return errors;
    }

    private static async Task<AllyScope?> ResolveAllyScopeAsync(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(rawUserId, out var userId) || !principal.IsInRole("aliado_admin"))
        {
            return null;
        }

        var row = await dbContext.AllyUserLinks.AsNoTracking()
            .Where(link => link.UserId == userId && link.IsActive && link.AllyRole == "aliado_admin")
            .Join(
                dbContext.AllyEntities.AsNoTracking().Where(entity => entity.Status == "activa"),
                link => link.AllyEntityId,
                entity => entity.Id,
                (link, entity) => new { Link = link, Entity = entity })
            .Join(
                dbContext.Users.AsNoTracking().Where(user => user.IsActive),
                item => item.Link.UserId,
                user => user.Id,
                (item, user) => new AllyScope(user, item.Entity, item.Link))
            .FirstOrDefaultAsync(cancellationToken);

        return row;
    }

    private static AllyPortalUserDto ToDto(UserRow user, AllyUserLinkRow link, AllyEntityRow entity)
    {
        return new AllyPortalUserDto(
            user.Id.ToString(CultureInfo.InvariantCulture),
            user.FullName,
            user.Email,
            link.AllyRole,
            entity.Id.ToString(CultureInfo.InvariantCulture),
            entity.Name,
            user.IsActive && link.IsActive,
            link.LinkedAt);
    }

    private static string NormalizeEmail(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string Clean(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private sealed record AllyScope(UserRow User, AllyEntityRow Entity, AllyUserLinkRow Link);
}
