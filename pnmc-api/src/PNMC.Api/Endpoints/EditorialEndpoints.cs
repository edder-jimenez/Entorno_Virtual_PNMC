using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class EditorialEndpoints
{
    public static RouteGroupBuilder MapEditorialEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/editorial").WithTags("editorial");

        async Task<IResult> listResourcesAsync(
            PnmcDbContext dbContext,
            string? section,
            string? year,
            string? q,
            int? limit,
            int? offset,
            CancellationToken cancellationToken)
        {
            var items = await BuildResourcesAsync(dbContext, cancellationToken);

            if (!string.IsNullOrWhiteSpace(section))
            {
                items = items.Where(item => string.Equals(item.Section, section, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(year))
            {
                items = items.Where(item => item.Year.Contains(year, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                items = items.Where(item =>
                    item.Title.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || item.DisplayAuthor.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || item.Summary.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || item.Keywords.Any(keyword => keyword.Contains(q, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 500);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var page = items.Skip(safeOffset).Take(safeLimit).ToList();

            return Results.Ok(new PagedResponse<EditorialResourceDto>(page, safeLimit, safeOffset, items.Count));
        }

        api.MapGet(string.Empty, listResourcesAsync);
        api.MapGet("/resources", listResourcesAsync);

        api.MapGet("/resources/{resourceId}", async (string resourceId, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var items = await BuildResourcesAsync(dbContext, cancellationToken);
            var item = items.FirstOrDefault(x => string.Equals(x.Id, resourceId, StringComparison.OrdinalIgnoreCase));
            return item is null ? Results.NotFound() : Results.Ok(item);
        });

        return group;
    }

    private static async Task<List<EditorialResourceDto>> BuildResourcesAsync(
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var items = await dbContext.EditorialItems.AsNoTracking().ToListAsync(cancellationToken);
        var classifications = await dbContext.EditorialClassifications.AsNoTracking().ToListAsync(cancellationToken);
        var bibliographicRecords = await dbContext.EditorialBibliographicRecords.AsNoTracking().ToListAsync(cancellationToken);
        var availability = await dbContext.EditorialAvailabilities.AsNoTracking().ToListAsync(cancellationToken);
        var categories = await dbContext.Categories.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
        var editorialFiles = await dbContext.EditorialFiles.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(cancellationToken);
        var files = await dbContext.Files.AsNoTracking().ToDictionaryAsync(x => x.Id, cancellationToken);

        var classificationByItem = classifications
            .GroupBy(x => x.EditorialItemId)
            .ToDictionary(group => group.Key, group => group.First());

        var bibliographicByItem = bibliographicRecords
            .GroupBy(x => x.EditorialItemId)
            .ToDictionary(group => group.Key, group => group.First());

        var availabilityByItem = availability
            .GroupBy(x => x.EditorialItemId)
            .ToDictionary(group => group.Key, group => group.First());

        var fileByItem = editorialFiles
            .GroupBy(x => x.EditorialItemId)
            .ToDictionary(group => group.Key, group => group.First());

        var resources = new List<EditorialResourceDto>(items.Count);

        foreach (var item in items)
        {
            classificationByItem.TryGetValue(item.Id, out var classification);
            bibliographicByItem.TryGetValue(item.Id, out var bibliographic);
            availabilityByItem.TryGetValue(item.Id, out var availabilityRecord);
            fileByItem.TryGetValue(item.Id, out var editorialFile);

            var fileRecord = editorialFile is not null && files.TryGetValue(editorialFile.FileId, out var foundFile)
                ? foundFile
                : null;

            var year = ResolveYear(bibliographic);
            var keywords = SplitKeywords(bibliographic?.Keywords);
            var categoryName = item.CategoryId.HasValue && categories.TryGetValue(item.CategoryId.Value, out var resolvedCategory)
                ? resolvedCategory
                : (classification?.EditorialCategory ?? string.Empty);

            resources.Add(new EditorialResourceDto(
                item.Id.ToString(),
                item.Title,
                year,
                classification?.MainSection ?? string.Empty,
                classification?.SectionPath ?? string.Empty,
                bibliographic?.PublicationType ?? string.Empty,
                classification?.MusicalPractice ?? string.Empty,
                categoryName,
                classification?.EditorialSubcategory ?? string.Empty,
                bibliographic?.MainAuthors ?? string.Empty,
                bibliographic?.CorporateAuthor ?? string.Empty,
                string.Empty,
                bibliographic?.ISBN ?? string.Empty,
                string.Empty,
                bibliographic?.FormatOrSize ?? string.Empty,
                string.Empty,
                string.Empty,
                classification?.RegionalScope ?? string.Empty,
                availabilityRecord?.Notes ?? string.Empty,
                availabilityRecord?.ResourceUrl ?? string.Empty,
                keywords,
                item.ShortDescription ?? string.Empty,
                string.Empty,
                bibliographic?.CoverText ?? string.Empty,
                fileRecord?.PublicUrl ?? fileRecord?.StoragePath ?? string.Empty,
                ResolveDisplayAuthor(bibliographic)
            ));
        }

        return resources;
    }

    private static string ResolveYear(EditorialBibliographicRecordRow? bibliographic)
    {
        if (bibliographic is null) return string.Empty;

        if (bibliographic.YearFrom.HasValue && bibliographic.YearTo.HasValue && bibliographic.YearFrom != bibliographic.YearTo)
        {
            return $"{bibliographic.YearFrom}-{bibliographic.YearTo}";
        }

        if (bibliographic.YearFrom.HasValue) return bibliographic.YearFrom.Value.ToString();
        if (bibliographic.YearTo.HasValue) return bibliographic.YearTo.Value.ToString();

        return string.Empty;
    }

    private static List<string> SplitKeywords(string? rawKeywords)
    {
        if (string.IsNullOrWhiteSpace(rawKeywords)) return [];

        return rawKeywords
            .Split([',', ';', '|'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string ResolveDisplayAuthor(EditorialBibliographicRecordRow? bibliographic)
    {
        if (bibliographic is null) return string.Empty;

        if (!string.IsNullOrWhiteSpace(bibliographic.MainAuthors)) return bibliographic.MainAuthors;
        if (!string.IsNullOrWhiteSpace(bibliographic.CorporateAuthor)) return bibliographic.CorporateAuthor;
        return string.Empty;
    }
}
