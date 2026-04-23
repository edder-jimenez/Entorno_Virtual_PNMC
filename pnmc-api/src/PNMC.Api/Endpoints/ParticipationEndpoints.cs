using PNMC.Contracts;
using PNMC.Infrastructure.Integrations.Participation;
using PNMC.Infrastructure.Common;

namespace PNMC.Api.Endpoints;

public static class ParticipationEndpoints
{
    private static readonly HashSet<string> AllowedActorTypes =
    [
        "individual",
        "collective",
        "organization",
        "festival",
        "market",
        "space"
    ];

    public static RouteGroupBuilder MapParticipationEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/participation").WithTags("participacion");

        api.MapGet("/submissions", async (
            IParticipationSubmissionStore store,
            string? actorType,
            string? department,
            string? q,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var all = await store.ListAsync(cancellationToken);

            var filtered = all.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(actorType))
            {
                filtered = filtered.Where(item =>
                    string.Equals(item.Payload.ActorType, actorType, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(department))
            {
                filtered = filtered.Where(item =>
                    item.Payload.Department.Contains(department, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                filtered = filtered.Where(item =>
                    item.Reference.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || (item.Payload.ActorName ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase)
                    || (item.Payload.Email ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase));
            }

            var ordered = filtered.OrderByDescending(item => item.SubmittedAt).ToList();
            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var page = ordered
                .Skip(safeOffset)
                .Take(safeLimit)
                .Select(item =>
                {
                    var payload = item.Payload ?? new ParticipationSubmissionRequest();
                    return new ParticipationSubmissionSummaryDto(
                        item.Reference,
                        item.SubmittedAt,
                        payload.ActorType ?? string.Empty,
                        payload.ActorName ?? string.Empty,
                        payload.Email ?? string.Empty,
                        payload.Department ?? string.Empty,
                        payload.Municipality ?? string.Empty,
                        item.ExternalSyncStatus ?? "backend_only");
                })
                .ToList();

            return Results.Ok(new PagedResponse<ParticipationSubmissionSummaryDto>(page, safeLimit, safeOffset, ordered.Count));
        });

        api.MapPost("/submissions", async (
            ParticipationSubmissionRequest request,
            IParticipationSubmissionStore store,
            CancellationToken cancellationToken) =>
        {
            var result = await CreateSubmissionAsync(request, store, cancellationToken);
            if (result.ErrorResult is not null)
            {
                return result.ErrorResult;
            }

            if (result.ValidationErrors.Count > 0)
            {
                return Results.ValidationProblem(result.ValidationErrors, statusCode: StatusCodes.Status400BadRequest);
            }

            return Results.Created($"/api/v1/participation/submissions/{result.Response!.Reference}", result.Response);
        });

        api.MapGet("/submissions/{reference}", async (string reference, IParticipationSubmissionStore store, CancellationToken cancellationToken) =>
        {
            var result = await store.FindByReferenceAsync(reference, cancellationToken);
            if (result is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(new ParticipationSubmissionResponse(
                result.Reference,
                "accepted",
                result.SubmittedAt,
                "Registro encontrado.",
                result.ExternalSyncStatus,
                result.ExternalSyncMessage
            ));
        });

        return group;
    }

    public static IEndpointRouteBuilder MapLegacyParticipationCompatibilityEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/map-participation", async (
            ParticipationSubmissionRequest request,
            IParticipationSubmissionStore store,
            CancellationToken cancellationToken) =>
        {
            var result = await CreateSubmissionAsync(request, store, cancellationToken);
            if (result.ErrorResult is not null)
            {
                return result.ErrorResult;
            }

            if (result.ValidationErrors.Count > 0)
            {
                return Results.BadRequest(new
                {
                    message = "No se recibió una ficha válida para guardar.",
                    errors = result.ValidationErrors
                });
            }

            return Results.Ok(new
            {
                fileName = "PNMC_Map_Participacion_backend_db",
                message = "La ficha quedó guardada automáticamente en SQL Server (backend).",
                reference = result.Response!.Reference,
                status = result.Response.Status,
                externalSyncStatus = result.Response.ExternalSyncStatus
            });
        }).WithTags("participacion");

        return app;
    }

    private static Dictionary<string, string[]> Validate(ParticipationSubmissionRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (ValidationHelpers.IsMissing(request.ActorType) || !AllowedActorTypes.Contains(request.ActorType))
        {
            errors["actorType"] = ["Actor type is required and must be a supported value."];
        }

        if (ValidationHelpers.IsMissing(request.ActorName))
        {
            errors["actorName"] = ["Actor name is required."];
        }

        if (!ValidationHelpers.IsValidEmail(request.Email))
        {
            errors["email"] = ["A valid email is required."];
        }

        if (ValidationHelpers.IsMissing(request.Phone))
        {
            errors["phone"] = ["Phone is required."];
        }

        if (ValidationHelpers.IsMissing(request.Department))
        {
            errors["department"] = ["Department is required."];
        }

        if (ValidationHelpers.IsMissing(request.Municipality))
        {
            errors["municipality"] = ["Municipality is required."];
        }

        if (ValidationHelpers.IsMissing(request.MusicalFields))
        {
            errors["musicalFields"] = ["Musical fields is required."];
        }

        if (ValidationHelpers.IsMissing(request.Description))
        {
            errors["description"] = ["Description is required."];
        }

        if (ValidationHelpers.IsMissing(request.Contribution))
        {
            errors["contribution"] = ["Contribution is required."];
        }

        if (!request.Consent)
        {
            errors["consent"] = ["Consent is required."];
        }

        return errors;
    }

    private static string BuildReference()
    {
        var random = Random.Shared.Next(100000, 999999);
        return $"MAP-{DateTime.UtcNow:yyyy}-{random}";
    }

    private static async Task<SubmissionCommandResult> CreateSubmissionAsync(
        ParticipationSubmissionRequest request,
        IParticipationSubmissionStore store,
        CancellationToken cancellationToken)
    {
        var errors = Validate(request);
        if (errors.Count > 0)
        {
            return SubmissionCommandResult.WithValidationErrors(errors);
        }

        var reference = string.IsNullOrWhiteSpace(request.Reference)
            ? BuildReference()
            : request.Reference.Trim();

        var submittedAt = DateTimeOffset.UtcNow;

        var submission = new ParticipationSubmissionEntity
        {
            Reference = reference,
            SubmittedAt = submittedAt,
            ExternalSyncStatus = "backend_only",
            ExternalSyncMessage = "Persistido en base de datos del backend.",
            Payload = request
        };

        await store.SaveAsync(submission, cancellationToken);

        return SubmissionCommandResult.WithResponse(new ParticipationSubmissionResponse(
            reference,
            "accepted",
            submission.SubmittedAt,
            "La ficha fue registrada por el backend de PNMC.",
            submission.ExternalSyncStatus,
            submission.ExternalSyncMessage
        ));
    }

    private sealed class SubmissionCommandResult
    {
        public Dictionary<string, string[]> ValidationErrors { get; init; } = [];
        public ParticipationSubmissionResponse? Response { get; init; }
        public IResult? ErrorResult { get; init; }

        public static SubmissionCommandResult WithValidationErrors(Dictionary<string, string[]> errors)
            => new() { ValidationErrors = errors };

        public static SubmissionCommandResult WithResponse(ParticipationSubmissionResponse response)
            => new() { Response = response };

        public static SubmissionCommandResult WithErrorResult(IResult result)
            => new() { ErrorResult = result };
    }
}
