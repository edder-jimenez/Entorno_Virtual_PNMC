using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class MapEndpoints
{
    public static RouteGroupBuilder MapMapEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/map").WithTags("mapa");

        api.MapGet("/topojson/territories", async (IWebHostEnvironment environment, CancellationToken cancellationToken) =>
            await ServeGeoAssetAsync(environment, "Departamentos-Municipos-COL.json", cancellationToken));

        api.MapGet("/geojson/departments", async (IWebHostEnvironment environment, CancellationToken cancellationToken) =>
            await ServeGeoAssetAsync(environment, "Departamentos-Municipos-COL.json", cancellationToken));

        api.MapGet("/geojson/municipalities", async (IWebHostEnvironment environment, CancellationToken cancellationToken) =>
            await ServeGeoAssetAsync(environment, "Departamentos-Municipos-COL.json", cancellationToken));

        api.MapGet("/summary", async (string? layer, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var normalizedLayer = string.IsNullOrWhiteSpace(layer) ? "General" : layer;

            var festivals = await dbContext.FestivalRecords.AsNoTracking().ToListAsync(cancellationToken);
            var schools = await dbContext.SchoolRecords.AsNoTracking().ToListAsync(cancellationToken);
            var markets = await dbContext.MarketRecords.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await dbContext.DivipolaLocations.AsNoTracking()
                .GroupBy(x => x.DepartmentCode)
                .Select(group => new { Code = group.Key, Name = group.First().DepartmentName })
                .ToDictionaryAsync(x => x.Code, x => x.Name, cancellationToken);

            var summary = new Dictionary<string, (int Festivals, int Schools, int Markets)>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in festivals)
            {
                AddRecord(summary, item.DepartmentCode, isFestival: true, isSchool: false, isMarket: false);
            }

            foreach (var item in schools)
            {
                AddRecord(summary, item.DepartmentCode, isFestival: false, isSchool: true, isMarket: false);
            }

            foreach (var item in markets)
            {
                AddRecord(summary, item.DepartmentCode, isFestival: false, isSchool: false, isMarket: true);
            }

            var items = summary
                .Select(kvp => new MapDepartmentSummaryDto(
                    ResolveDepartment(kvp.Key, departments),
                    kvp.Value.Festivals + kvp.Value.Schools + kvp.Value.Markets,
                    kvp.Value.Festivals,
                    kvp.Value.Schools,
                    kvp.Value.Markets))
                .OrderByDescending(item => item.Records)
                .ToList();

            return Results.Ok(new MapSummaryResponseDto(normalizedLayer, items));
        });

        api.MapGet("/departments/{departmentCode}/drilldown", async (
            string departmentCode,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var targetCode = NormalizeDepartmentCode(departmentCode);
            if (targetCode.Length == 0) return Results.NotFound();

            var festivals = await dbContext.FestivalRecords.AsNoTracking().ToListAsync(cancellationToken);
            var schools = await dbContext.SchoolRecords.AsNoTracking().ToListAsync(cancellationToken);
            var markets = await dbContext.MarketRecords.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await dbContext.DivipolaLocations.AsNoTracking()
                .GroupBy(x => x.DepartmentCode)
                .Select(group => new { Code = group.Key, Name = group.First().DepartmentName })
                .ToDictionaryAsync(x => x.Code, x => x.Name, cancellationToken);
            var municipalities = await dbContext.DivipolaLocations.AsNoTracking()
                .ToDictionaryAsync(x => x.MunicipalityCode, x => x.MunicipalityName, cancellationToken);

            var festivalItems = festivals
                .Where(item => NormalizeDepartmentCode(item.DepartmentCode) == targetCode)
                .Select(item => new FestivalDrilldownItemDto(
                    item.Id.ToString(CultureInfo.InvariantCulture),
                    item.Name,
                    ResolveMunicipality(item.MunicipalityCode, municipalities)))
                .ToList();

            var schoolItems = schools
                .Where(item => NormalizeDepartmentCode(item.DepartmentCode) == targetCode)
                .Select(item => new SchoolDrilldownItemDto(
                    item.Id.ToString(CultureInfo.InvariantCulture),
                    item.Name,
                    ResolveMunicipality(item.MunicipalityCode, municipalities),
                    item.StudentsTotal ?? item.StudentsAgeTotal ?? 0,
                    0))
                .ToList();

            var marketItems = markets
                .Where(item => NormalizeDepartmentCode(item.DepartmentCode) == targetCode)
                .Select(item => new MarketDrilldownItemDto(
                    item.Id.ToString(CultureInfo.InvariantCulture),
                    item.Name,
                    ResolveMunicipality(item.MunicipalityCode, municipalities),
                    0,
                    0))
                .ToList();

            var response = new DepartmentDrilldownResponseDto(
                ResolveDepartment(targetCode, departments),
                festivalItems,
                schoolItems,
                marketItems);
            return Results.Ok(response);
        });

        return group;
    }

    private static void AddRecord(
        IDictionary<string, (int Festivals, int Schools, int Markets)> summary,
        string? departmentCode,
        bool isFestival,
        bool isSchool,
        bool isMarket)
    {
        var normalizedDepartmentCode = NormalizeDepartmentCode(departmentCode);
        if (normalizedDepartmentCode.Length == 0) return;

        var current = summary.TryGetValue(normalizedDepartmentCode, out var found)
            ? found
            : (Festivals: 0, Schools: 0, Markets: 0);
        summary[normalizedDepartmentCode] = (
            current.Festivals + (isFestival ? 1 : 0),
            current.Schools + (isSchool ? 1 : 0),
            current.Markets + (isMarket ? 1 : 0));
    }

    private static string NormalizeDepartmentCode(string? value)
    {
        var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return string.Empty;
        return digits.PadLeft(2, '0')[^2..];
    }

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

    private static async Task<IResult> ServeGeoAssetAsync(
        IWebHostEnvironment environment,
        string fileName,
        CancellationToken cancellationToken)
    {
        var geoJsonPath = Path.Combine(environment.ContentRootPath, "Assets", "geo", fileName);
        if (!File.Exists(geoJsonPath))
        {
            return Results.NotFound(new { message = $"Geo file '{fileName}' not found." });
        }

        await using var stream = File.OpenRead(geoJsonPath);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return Results.Ok(document.RootElement.Clone());
    }
}
