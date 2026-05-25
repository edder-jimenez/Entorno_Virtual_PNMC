using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AdminAuthEndpoints
{
    private static readonly PasswordHasher<UserRow> PasswordHasher = new();

    public static RouteGroupBuilder MapAdminAuthEndpoints(this RouteGroupBuilder group)
    {
        var auth = group.MapGroup("/admin/auth").WithTags("admin-auth");

        auth.MapPost("/login", async (
            AdminLoginRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (ValidationHelpers.IsMissing(email) || ValidationHelpers.IsMissing(request.Password))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["credentials"] = ["Correo y contrasena son obligatorios."]
                });
            }

            var user = await FindUserByEmailAsync(dbContext, email, cancellationToken);
            if (user is null || !user.IsActive || !IsPasswordValid(user, request.Password))
            {
                return Results.Unauthorized();
            }

            var role = await dbContext.Roles.AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == user.RoleId, cancellationToken);
            if (role is null)
            {
                return Results.Problem("El usuario no tiene un rol administrativo valido.", statusCode: StatusCodes.Status403Forbidden);
            }

            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            await WriteAuditAsync(dbContext, user.Id, "Usuarios", user.Id.ToString(), "iniciar_sesion", cancellationToken);

            var principal = BuildPrincipal(user, role);
            await httpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    IssuedUtc = DateTimeOffset.UtcNow,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8),
                    AllowRefresh = true
                });

            return Results.Ok(new AdminAuthResponse(ToDto(user, role)));
        });

        auth.MapGet("/me", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var current = await ResolveCurrentUserAsync(principal, dbContext, cancellationToken);
            return current is null
                ? Results.Unauthorized()
                : Results.Ok(new AdminAuthResponse(ToDto(current.Value.User, current.Value.Role)));
        });

        auth.MapPost("/logout", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var current = await ResolveCurrentUserAsync(principal, dbContext, cancellationToken);
            if (current is not null)
            {
                await WriteAuditAsync(dbContext, current.Value.User.Id, "Usuarios", current.Value.User.Id.ToString(), "cerrar_sesion", cancellationToken);
            }

            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        }).RequireAuthorization();

        auth.MapGet("/users", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (!UserHasRole(principal, "webmaster"))
            {
                return Results.Forbid();
            }

            var userRows = await dbContext.Users.AsNoTracking()
                .Join(
                    dbContext.Roles.AsNoTracking(),
                    user => user.RoleId,
                    role => role.Id,
                    (user, role) => new { User = user, Role = role })
                .OrderBy(item => item.User.FullName)
                .ToListAsync(cancellationToken);
            var users = userRows.Select(item => ToDto(item.User, item.Role)).ToList();

            return Results.Ok(users);
        }).RequireAuthorization();

        auth.MapPost("/users", async (
            AdminUserUpsertRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (!UserHasRole(principal, "webmaster"))
            {
                return Results.Forbid();
            }

            if (ValidationHelpers.IsMissing(request.FullName)
                || ValidationHelpers.IsMissing(request.Email)
                || ValidationHelpers.IsMissing(request.Role))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["user"] = ["Nombre, correo y rol son obligatorios."]
                });
            }

            var normalizedRole = NormalizeRole(request.Role);
            var role = await dbContext.Roles.FirstOrDefaultAsync(
                item => item.Name.ToLower() == normalizedRole,
                cancellationToken);
            if (role is null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["role"] = ["El rol indicado no existe."]
                });
            }

            var email = NormalizeEmail(request.Email);
            var existing = await FindUserByEmailAsync(dbContext, email, cancellationToken);
            if (existing is not null
                && (!int.TryParse(request.Id, out var requestId) || existing.Id != requestId))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["email"] = ["Ya existe un usuario con ese correo."]
                });
            }

            UserRow user;
            var isNew = !int.TryParse(request.Id, out var id) || id <= 0;
            if (isNew)
            {
                if (ValidationHelpers.IsMissing(request.Password) || request.Password.Length < 10)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["password"] = ["La contrasena inicial debe tener minimo 10 caracteres."]
                    });
                }

                user = new UserRow
                {
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.Users.Add(user);
            }
            else
            {
                user = await dbContext.Users.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
                    ?? throw new InvalidOperationException("Usuario no encontrado.");
            }

            user.FullName = request.FullName.Trim();
            user.Email = email;
            user.RoleId = role.Id;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            if (!ValidationHelpers.IsMissing(request.Password))
            {
                if (request.Password.Length < 10)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["password"] = ["La contrasena debe tener minimo 10 caracteres."]
                    });
                }

                user.PasswordHash = PasswordHasher.HashPassword(user, request.Password);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await WriteAuditAsync(
                dbContext,
                GetCurrentUserId(principal),
                "Usuarios",
                user.Id.ToString(),
                isNew ? "crear" : "actualizar",
                cancellationToken,
                JsonSerializer.Serialize(new { user.FullName, user.Email, role = role.Name, user.IsActive }));

            return Results.Ok(new AdminAuthResponse(ToDto(user, role)));
        }).RequireAuthorization();

        return group;
    }

    public static PasswordVerificationResult VerifyPassword(UserRow user, string password)
    {
        return PasswordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
    }

    public static string HashPassword(UserRow user, string password)
    {
        return PasswordHasher.HashPassword(user, password);
    }

    private static ClaimsPrincipal BuildPrincipal(UserRow user, RoleRow role)
    {
        var normalizedRole = NormalizeRole(role.Name);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, normalizedRole),
            new("pnmc_role_label", role.Name)
        };

        return new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
    }

    private static async Task<(UserRow User, RoleRow Role)?> ResolveCurrentUserAsync(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId(principal);
        if (userId is null)
        {
            return null;
        }

        var user = await dbContext.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId.Value && item.IsActive, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var role = await dbContext.Roles.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == user.RoleId, cancellationToken);

        return role is null ? null : (user, role);
    }

    private static async Task<UserRow?> FindUserByEmailAsync(PnmcDbContext dbContext, string email, CancellationToken cancellationToken)
    {
        return await dbContext.Users.FirstOrDefaultAsync(
            item => item.Email.ToLower() == email,
            cancellationToken);
    }

    private static bool IsPasswordValid(UserRow user, string password)
    {
        try
        {
            return VerifyPassword(user, password) is PasswordVerificationResult.Success
                or PasswordVerificationResult.SuccessRehashNeeded;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static AdminUserDto ToDto(UserRow user, RoleRow role)
    {
        var normalizedRole = NormalizeRole(role.Name);
        return new AdminUserDto(
            user.Id.ToString(),
            user.FullName,
            user.Email,
            normalizedRole,
            role.Name,
            user.IsActive,
            user.LastLoginAt);
    }

    private static string NormalizeEmail(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string NormalizeRole(string value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            "administrador" or "admin" => "webmaster",
            "lider_de_componente" or "lider-componente" => "lider",
            "cargador" or "contributor" or "usuario_externo" => "gestor",
            _ => normalized
        };
    }

    private static bool UserHasRole(ClaimsPrincipal principal, string role)
    {
        return principal.Identity?.IsAuthenticated == true
            && principal.IsInRole(NormalizeRole(role));
    }

    private static int? GetCurrentUserId(ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(rawUserId, out var userId) ? userId : null;
    }

    private static async Task WriteAuditAsync(
        PnmcDbContext dbContext,
        int? userId,
        string tableName,
        string recordId,
        string action,
        CancellationToken cancellationToken,
        string? newValuesJson = null)
    {
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = userId,
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            NewValuesJson = newValuesJson,
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
