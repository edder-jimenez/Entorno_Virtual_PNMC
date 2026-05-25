using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;
using System.Text.RegularExpressions;

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
        var catalogResources = await dbContext.EditorialCatalogResources.AsNoTracking()
            .Where(item => item.IsActive)
            .OrderBy(item => item.SourceOrder)
            .ThenBy(item => item.Title)
            .ToListAsync(cancellationToken);

        if (catalogResources.Count > 0)
        {
            return catalogResources.Select(item => new EditorialResourceDto(
                item.ExternalId,
                item.Title,
                item.Year,
                item.Section,
                item.SectionPath,
                item.PublicationType,
                item.Practice,
                item.Category,
                item.Subcategory,
                item.Author,
                item.CorporateAuthor,
                item.Credits,
                item.Isbn,
                item.Ismn,
                item.FormatSize,
                item.Pages,
                item.Duration,
                item.RegionalScope,
                item.Location,
                item.Url,
                SplitKeywords(item.Keywords),
                item.Summary,
                item.AdditionalFields,
                item.CoverText,
                NormalizeThumbnailPath(item.ThumbnailPath),
                ResolveDisplayAuthor(item.Author, item.CorporateAuthor)
            )).ToList();
        }

        var categories = await dbContext.Categories.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
        var albums = await dbContext.GalleryAlbums.AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.PublishedAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);
        var albumFiles = await dbContext.GalleryAlbumFiles.AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);
        var files = await dbContext.Files.AsNoTracking().ToDictionaryAsync(x => x.Id, cancellationToken);

        var fileByAlbum = albumFiles
            .GroupBy(x => x.AlbumId)
            .ToDictionary(group => group.Key, group => group.First());

        var resources = new List<EditorialResourceDto>(albums.Count);

        foreach (var album in albums)
        {
            fileByAlbum.TryGetValue(album.Id, out var albumFile);

            var fileRecord = albumFile is not null && files.TryGetValue(albumFile.FileId, out var foundFile)
                ? foundFile
                : null;

            var categoryName = album.CategoryId.HasValue && categories.TryGetValue(album.CategoryId.Value, out var resolvedCategory)
                ? resolvedCategory
                : "Galeria";
            var fileUrl = fileRecord?.PublicUrl ?? fileRecord?.StoragePath ?? string.Empty;

            resources.Add(new EditorialResourceDto(
                album.Id.ToString(),
                album.Title,
                ResolveYear(album.PublishedAt ?? album.CreatedAt),
                categoryName,
                categoryName,
                "Album de galeria",
                string.Empty,
                categoryName,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                fileUrl,
                fileUrl,
                [],
                album.Description ?? string.Empty,
                string.Empty,
                album.Description ?? string.Empty,
                fileUrl,
                "PNMC"
            ));
        }

        return resources;
    }

    private static string ResolveYear(DateTime? date) => date?.Year.ToString() ?? string.Empty;

    private static IReadOnlyList<string> SplitKeywords(string? keywords)
    {
        return string.IsNullOrWhiteSpace(keywords)
            ? []
            : keywords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    private static string ResolveDisplayAuthor(string? author, string? corporateAuthor)
    {
        if (!string.IsNullOrWhiteSpace(author)) return author;
        if (!string.IsNullOrWhiteSpace(corporateAuthor)) return corporateAuthor;
        return "PNMC";
    }

    private static string NormalizeThumbnailPath(string? thumbnailPath)
    {
        if (string.IsNullOrWhiteSpace(thumbnailPath)) return string.Empty;

        var normalized = thumbnailPath.Trim();

        if (Uri.TryCreate(normalized, UriKind.Absolute, out var absoluteUri)
            && (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
        {
            return normalized;
        }

        if (normalized.StartsWith("/mnt/", StringComparison.OrdinalIgnoreCase)
            || normalized.StartsWith("/var/", StringComparison.OrdinalIgnoreCase)
            || normalized.StartsWith("/tmp/", StringComparison.OrdinalIgnoreCase)
            || Regex.IsMatch(normalized, @"^[A-Za-z]:\\"))
        {
            return string.Empty;
        }

        return normalized.StartsWith('/') ? normalized : $"/{normalized}";
    }
}
