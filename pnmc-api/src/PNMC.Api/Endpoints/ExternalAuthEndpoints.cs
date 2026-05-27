using System.Globalization;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class ExternalAuthEndpoints
{
    private static readonly PasswordHasher<UserRow> PasswordHasher = new();

    public static RouteGroupBuilder MapExternalAuthEndpoints(this RouteGroupBuilder group)
    {
        var external = group.MapGroup("/external/auth").WithTags("external-auth");

        external.MapPost("/register", async (
            ExternalRegisterRequest request,
            PnmcDbContext dbContext,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var errors = await ValidateRegisterRequestAsync(request, dbContext, cancellationToken);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var email = NormalizeEmail(request.Email);
            var existing = await dbContext.Users.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
            if (existing is not null)
            {
                return Results.Conflict(new { message = "Ya existe una cuenta registrada con ese correo." });
            }

            var role = await dbContext.Roles.FirstOrDefaultAsync(item => item.Name == "externo", cancellationToken)
                ?? throw new InvalidOperationException("No existe el rol externo.");
            var now = DateTime.UtcNow;
            var displayName = ResolveDisplayName(request);
            var user = new UserRow
            {
                FullName = displayName,
                Email = email,
                RoleId = role.Id,
                AccessChannel = "externo",
                ProfileType = Clean(request.ProfileType),
                IsActive = false,
                CreatedAt = now,
                UpdatedAt = now
            };
            user.PasswordHash = PasswordHasher.HashPassword(user, request.Password);
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);

            var code = GenerateCode();
            var expiresAt = now.AddMinutes(20);
            dbContext.UserVerificationCodes.Add(new UserVerificationCodeRow
            {
                UserId = user.Id,
                Purpose = "external_email_verification",
                Code = code,
                ExpiresAt = expiresAt,
                CreatedAt = now
            });
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/v1/external/auth/users/{user.Id}", new ExternalRegisterResponse(
                user.Id.ToString(CultureInfo.InvariantCulture),
                user.Email,
                "correo_pendiente",
                "codigo_generado",
                expiresAt,
                environment.IsDevelopment() || environment.IsEnvironment("Local") || environment.IsEnvironment("Test") ? code : string.Empty));
        }).RequireRateLimiting("external-register");

        external.MapPost("/verify-email", async (
            ExternalVerifyEmailRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (!ValidationHelpers.IsValidEmail(email) || ValidationHelpers.IsMissing(request.Code))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["verification"] = ["Correo y codigo de verificacion son obligatorios."]
                });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            if (user is null)
            {
                return Results.NotFound();
            }

            var now = DateTime.UtcNow;
            var code = await dbContext.UserVerificationCodes
                .Where(item =>
                    item.UserId == user.Id
                    && item.Purpose == "external_email_verification"
                    && item.ConsumedAt == null
                    && item.ExpiresAt >= now)
                .OrderByDescending(item => item.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (code is null || !string.Equals(code.Code, request.Code.Trim(), StringComparison.Ordinal))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["code"] = ["El codigo de verificacion no es valido o ya expiro."]
                });
            }

            code.ConsumedAt = now;
            user.IsActive = true;
            user.UpdatedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new ExternalVerifyEmailResponse(
                user.Id.ToString(CultureInfo.InvariantCulture),
                user.Email,
                "activo"));
        }).RequireRateLimiting("external-register");

        return group;
    }

    private static async Task<Dictionary<string, string[]>> ValidateRegisterRequestAsync(
        ExternalRegisterRequest request,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        var profileType = Clean(request.ProfileType);
        if (profileType is not "persona" and not "organizacion")
        {
            errors["profileType"] = ["Tipo de perfil debe ser persona u organizacion."];
        }

        if (profileType == "persona" && ValidationHelpers.IsMissing(request.FullName))
        {
            errors["fullName"] = ["Nombre completo es obligatorio para persona."];
        }

        if (profileType == "organizacion" && ValidationHelpers.IsMissing(request.OrganizationName))
        {
            errors["organizationName"] = ["Nombre de organizacion es obligatorio."];
        }

        if (!ValidationHelpers.IsValidEmail(request.Email)) errors["email"] = ["Correo electronico no es valido."];
        if (ValidationHelpers.IsMissing(request.ActorType)) errors["actorType"] = ["Tipo de actor es obligatorio."];
        if (ValidationHelpers.IsMissing(request.DepartmentCode)) errors["departmentCode"] = ["Codigo de departamento es obligatorio."];
        if (ValidationHelpers.IsMissing(request.MunicipalityCode)) errors["municipalityCode"] = ["Codigo de municipio es obligatorio."];
        if (ValidationHelpers.IsMissing(request.Password) || request.Password.Length < 10) errors["password"] = ["La contrasena debe tener minimo 10 caracteres."];
        if (!request.AcceptTerms) errors["acceptTerms"] = ["Debes aceptar los terminos de uso."];
        if (!request.AcceptDataPolicy) errors["acceptDataPolicy"] = ["Debes aceptar la politica de tratamiento de datos."];
        if (!request.AuthorizePublicData) errors["authorizePublicData"] = ["Debes autorizar la publicacion de datos publicos del registro."];

        if (!errors.ContainsKey("departmentCode") && !errors.ContainsKey("municipalityCode"))
        {
            var territoryExists = await dbContext.DivipolaLocations.AsNoTracking().AnyAsync(item =>
                item.DepartmentCode == request.DepartmentCode.Trim()
                && item.MunicipalityCode == request.MunicipalityCode.Trim(),
                cancellationToken);
            if (!territoryExists)
            {
                errors["territory"] = ["Departamento y municipio no existen en DIVIPOLA."];
            }
        }

        return errors;
    }

    private static string ResolveDisplayName(ExternalRegisterRequest request)
    {
        return Clean(request.ProfileType) == "organizacion"
            ? ValidationHelpers.SanitizeText(request.OrganizationName, 240)
            : ValidationHelpers.SanitizeText(request.FullName, 240);
    }

    private static string GenerateCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString(CultureInfo.InvariantCulture);
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
