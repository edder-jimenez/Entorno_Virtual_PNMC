using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AgendaEndpoints
{
    public static RouteGroupBuilder MapAgendaEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/agenda").WithTags("agenda");

        api.MapGet("/events", async (
            PnmcDbContext dbContext,
            string? month,
            string? tag,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var events = await dbContext.AgendaEvents.AsNoTracking().ToListAsync(cancellationToken);
            var categories = await dbContext.Categories.AsNoTracking()
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
            var departments = await dbContext.DivipolaLocations.AsNoTracking()
                .GroupBy(x => x.DepartmentCode)
                .Select(group => new { Code = group.Key, Name = group.First().DepartmentName })
                .ToDictionaryAsync(x => x.Code, x => x.Name, cancellationToken);
            var municipalities = await dbContext.DivipolaLocations.AsNoTracking()
                .ToDictionaryAsync(x => x.MunicipalityCode, x => x.MunicipalityName, cancellationToken);

            var items = events.Select(row => ToAgendaEvent(row, categories, departments, municipalities)).ToList();

            if (!string.IsNullOrWhiteSpace(tag))
            {
                items = items.Where(item => item.Tags.Any(t => string.Equals(t, tag, StringComparison.OrdinalIgnoreCase))).ToList();
            }

            if (!string.IsNullOrWhiteSpace(month))
            {
                items = items.Where(item => item.Date.StartsWith(month, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var page = items.Skip(safeOffset).Take(safeLimit).ToList();

            return Results.Ok(new PagedResponse<AgendaEventDto>(page, safeLimit, safeOffset, items.Count));
        });

        api.MapGet("/events/{eventId}", async (
            string eventId,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (!int.TryParse(eventId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var eventIntId))
            {
                return Results.NotFound();
            }

            var row = await dbContext.AgendaEvents.AsNoTracking().FirstOrDefaultAsync(r => r.Id == eventIntId, cancellationToken);
            if (row is null) return Results.NotFound();

            var categories = await dbContext.Categories.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
            var departments = await dbContext.DivipolaLocations.AsNoTracking()
                .GroupBy(x => x.DepartmentCode)
                .Select(group => new { Code = group.Key, Name = group.First().DepartmentName })
                .ToDictionaryAsync(x => x.Code, x => x.Name, cancellationToken);
            var municipalities = await dbContext.DivipolaLocations.AsNoTracking()
                .ToDictionaryAsync(x => x.MunicipalityCode, x => x.MunicipalityName, cancellationToken);

            return Results.Ok(ToAgendaEvent(row, categories, departments, municipalities));
        });

        return group;
    }

    private static AgendaEventDto ToAgendaEvent(
        AgendaEventRow row,
        IReadOnlyDictionary<int, string> categories,
        IReadOnlyDictionary<string, string> departments,
        IReadOnlyDictionary<string, string> municipalities)
    {
        var date = row.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var timeLabel = row.StartTime.HasValue
            ? DateTime.Today.Add(row.StartTime.Value).ToString("h:mm tt", CultureInfo.InvariantCulture)
            : string.Empty;

        var municipality = ResolveMunicipality(row.MunicipalityCode, municipalities);
        var department = ResolveDepartment(row.DepartmentCode, departments);

        return new AgendaEventDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            row.Title,
            row.ShortDescription ?? row.Description ?? string.Empty,
            ResolveCategory(row.CategoryId, categories),
            date,
            timeLabel,
            row.SpecificLocation ?? string.Empty,
            municipality,
            department,
            row.OrganizationName ?? string.Empty,
            string.Empty,
            []
        );
    }

    private static string ResolveCategory(int? categoryId, IReadOnlyDictionary<int, string> categories)
        => categoryId.HasValue && categories.TryGetValue(categoryId.Value, out var name) ? name : string.Empty;

    private static string ResolveDepartment(string? departmentCode, IReadOnlyDictionary<string, string> departments)
    {
        if (string.IsNullOrWhiteSpace(departmentCode)) return string.Empty;
        return departments.TryGetValue(departmentCode, out var name) ? name : departmentCode;
    }

    private static string ResolveMunicipality(string? municipalityCode, IReadOnlyDictionary<string, string> municipalities)
    {
        if (string.IsNullOrWhiteSpace(municipalityCode)) return string.Empty;
        return municipalities.TryGetValue(municipalityCode, out var name) ? name : municipalityCode;
    }
}
