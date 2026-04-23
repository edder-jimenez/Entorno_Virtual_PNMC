using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class CatalogModuleEndpoints
{
    public static RouteGroupBuilder MapCatalogModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapFestivalModuleEndpoints();
        group.MapMusicSchoolModuleEndpoints();
        group.MapMusicMarketModuleEndpoints();
        group.MapOrganizationModuleEndpoints();
        group.MapSpacesInfrastructureModuleEndpoints();
        group.MapDivipolaModuleEndpoints();
        group.MapProcessRelationModuleEndpoints();

        return group;
    }

    private static RouteGroupBuilder MapFestivalModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/festivals", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.FestivalRecords.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);

            var mapped = rows.Select(row => new FestivalDto(
                row.Id.ToString(),
                row.Name,
                row.DepartmentCode,
                ResolveDepartmentName(row.DepartmentCode, departments),
                row.MunicipalityCode ?? string.Empty,
                ResolveMunicipalityName(row.MunicipalityCode, municipalities),
                row.CoverageLevel,
                row.Description ?? string.Empty,
                row.SpecificLocation ?? string.Empty,
                row.VersionsCount ?? 0,
                FormatDate(row.LastEditionDate),
                row.OrganizerDisplayName ?? string.Empty,
                row.ContactEmail ?? string.Empty,
                row.ContactPhone ?? string.Empty,
                row.WebsiteUrl ?? string.Empty,
                row.HasCurrentYearEdition,
                row.CurrentYearEditionStatus ?? string.Empty,
                FormatDate(row.CurrentYearStartDate),
                FormatDate(row.CurrentYearEndDate))).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("festivals");

        return group;
    }

    private static RouteGroupBuilder MapMusicSchoolModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/music-schools", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.SchoolRecords.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);

            var mapped = rows.Select(row => new MusicSchoolDto(
                row.Id.ToString(),
                row.Name,
                row.DepartmentCode,
                ResolveDepartmentName(row.DepartmentCode, departments),
                row.MunicipalityCode ?? string.Empty,
                ResolveMunicipalityName(row.MunicipalityCode, municipalities),
                row.CoverageLevel,
                row.SpecificLocation ?? string.Empty,
                row.AddressText ?? string.Empty,
                row.SchoolType ?? string.Empty,
                row.SchoolCategory ?? string.Empty,
                row.IsActiveSchool,
                row.StudentsTotal ?? row.StudentsAgeTotal ?? 0,
                row.ActiveGroupsCount ?? 0,
                row.HasCommunityOrganization,
                row.TrainingProcesses ?? string.Empty,
                row.MusicalPractices ?? string.Empty,
                row.ResponsibleEntityDisplayName ?? string.Empty,
                row.ContactEmail ?? string.Empty,
                row.ContactPhone ?? string.Empty,
                row.WebsiteUrl ?? string.Empty)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("music-schools");

        return group;
    }

    private static RouteGroupBuilder MapMusicMarketModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/music-markets", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.MarketRecords.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);

            var mapped = rows.Select(row => new MusicMarketDto(
                row.Id.ToString(),
                row.Name,
                row.DepartmentCode,
                ResolveDepartmentName(row.DepartmentCode, departments),
                row.MunicipalityCode ?? string.Empty,
                ResolveMunicipalityName(row.MunicipalityCode, municipalities),
                row.CoverageLevel,
                row.Description ?? string.Empty,
                row.Periodicity ?? string.Empty,
                row.EditionsCount ?? 0,
                row.HasAssociatedFestival,
                row.AssociatedFestivalDisplayName ?? string.Empty,
                row.ScopeType ?? string.Empty,
                row.MarketMode ?? string.Empty,
                row.ResponsibleEntityDisplayName ?? string.Empty,
                row.ResponsibleEntityContactEmail ?? string.Empty,
                row.ResponsibleEntityContactPhone ?? string.Empty,
                row.ResponsibleEntityWebsiteUrl ?? string.Empty,
                row.HasCurrentYearEdition,
                row.CurrentYearEditionStatus ?? string.Empty,
                FormatDate(row.CurrentYearStartDate),
                FormatDate(row.CurrentYearEndDate),
                row.SpecificLocation ?? string.Empty)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("music-markets");

        return group;
    }

    private static RouteGroupBuilder MapOrganizationModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/organizations", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.Organizations.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);

            var mapped = rows.Select(row => new OrganizationDto(
                row.Id.ToString(),
                row.Name,
                row.DepartmentCode,
                ResolveDepartmentName(row.DepartmentCode, departments),
                row.MunicipalityCode ?? string.Empty,
                ResolveMunicipalityName(row.MunicipalityCode, municipalities),
                row.OrganizationType ?? string.Empty,
                row.TerritorialScope ?? string.Empty,
                row.ContactEmail ?? string.Empty,
                row.ContactPhone ?? string.Empty)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("organizations");

        return group;
    }

    private static RouteGroupBuilder MapSpacesInfrastructureModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/spaces-infrastructure", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.SpacesInfrastructure.AsNoTracking().ToListAsync(cancellationToken);
            var departments = await BuildDepartmentDictionaryAsync(dbContext, cancellationToken);
            var municipalities = await BuildMunicipalityDictionaryAsync(dbContext, cancellationToken);

            var mapped = rows.Select(row => new SpaceInfrastructureDto(
                row.Id.ToString(),
                row.Name,
                row.DepartmentCode,
                ResolveDepartmentName(row.DepartmentCode, departments),
                row.MunicipalityCode ?? string.Empty,
                ResolveMunicipalityName(row.MunicipalityCode, municipalities),
                row.ActorType ?? string.Empty,
                row.PrimaryFunction ?? string.Empty,
                row.MaxCapacityApprox ?? 0)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("spaces-infrastructure");

        return group;
    }

    private static RouteGroupBuilder MapDivipolaModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/divipola/locations", async (
            PnmcDbContext dbContext,
            string? departmentCode,
            string? municipalityCode,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var query = dbContext.DivipolaLocations.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(departmentCode))
            {
                query = query.Where(item => item.DepartmentCode == departmentCode);
            }

            if (!string.IsNullOrWhiteSpace(municipalityCode))
            {
                query = query.Where(item => item.MunicipalityCode == municipalityCode);
            }

            var rows = await query
                .OrderBy(item => item.DepartmentName)
                .ThenBy(item => item.MunicipalityName)
                .ToListAsync(cancellationToken);

            var mapped = rows.Select(row => new DivipolaLocationDto(
                row.DepartmentCode,
                row.DepartmentName,
                row.MunicipalityCode,
                row.MunicipalityName,
                row.LocationType ?? string.Empty,
                row.Latitude,
                row.Longitude)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("divipola");

        group.MapGet("/divipola/grouped", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.DivipolaLocations.AsNoTracking().ToListAsync(cancellationToken);
            var grouped = rows
                .GroupBy(row => row.DepartmentName)
                .OrderBy(group => group.Key)
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .Select(row => row.MunicipalityName)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                        .ToList());

            return Results.Ok(grouped);
        }).WithTags("divipola");

        return group;
    }

    private static RouteGroupBuilder MapProcessRelationModuleEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/process-entity-relations", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.ProcessEntityRelations.AsNoTracking().ToListAsync(cancellationToken);

            var mapped = rows.Select(row => new ProcessEntityRelationDto(
                row.Id.ToString(),
                row.ProcessType,
                row.ProcessId,
                row.EntityType,
                row.EntityId,
                row.RelationshipType,
                row.Notes ?? string.Empty)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("process-entity-relations");

        group.MapGet("/process-relations", async (
            PnmcDbContext dbContext,
            int? limit,
            int? offset,
            CancellationToken cancellationToken) =>
        {
            var rows = await dbContext.ProcessRelations.AsNoTracking().ToListAsync(cancellationToken);

            var mapped = rows.Select(row => new ProcessRelationDto(
                row.Id.ToString(),
                row.SourceProcessType,
                row.SourceProcessId,
                row.TargetProcessType,
                row.TargetProcessId,
                row.RelationshipType,
                row.Notes ?? string.Empty)).ToList();

            return Results.Ok(ToPage(mapped, limit, offset));
        }).WithTags("process-relations");

        return group;
    }

    private static async Task<Dictionary<string, string>> BuildDepartmentDictionaryAsync(
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(x => x.DepartmentCode)
            .Select(group => new { Code = group.Key, Name = group.First().DepartmentName })
            .ToDictionaryAsync(x => x.Code, x => x.Name, cancellationToken);
    }

    private static async Task<Dictionary<string, string>> BuildMunicipalityDictionaryAsync(
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        return await dbContext.DivipolaLocations.AsNoTracking()
            .ToDictionaryAsync(x => x.MunicipalityCode, x => x.MunicipalityName, cancellationToken);
    }

    private static string ResolveDepartmentName(string? departmentCode, IReadOnlyDictionary<string, string> departments)
    {
        if (string.IsNullOrWhiteSpace(departmentCode)) return string.Empty;
        return departments.TryGetValue(departmentCode, out var name) ? name : departmentCode;
    }

    private static string ResolveMunicipalityName(string? municipalityCode, IReadOnlyDictionary<string, string> municipalities)
    {
        if (string.IsNullOrWhiteSpace(municipalityCode)) return string.Empty;
        return municipalities.TryGetValue(municipalityCode, out var name) ? name : municipalityCode;
    }

    private static PagedResponse<T> ToPage<T>(IReadOnlyList<T> items, int? limit, int? offset)
    {
        var safeLimit = Math.Clamp(limit ?? 100, 1, 500);
        var safeOffset = Math.Max(offset ?? 0, 0);
        var page = items.Skip(safeOffset).Take(safeLimit).ToList();

        return new PagedResponse<T>(page, safeLimit, safeOffset, items.Count);
    }

    private static string FormatDate(DateTime? value)
        => value.HasValue
            ? value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            : string.Empty;
}
