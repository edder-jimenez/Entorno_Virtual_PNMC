using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class NewsEndpoints
{
    public static RouteGroupBuilder MapNewsEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/news").WithTags("noticias");

        async Task<IResult> listNewsAsync(
            PnmcDbContext dbContext,
            string? month,
            string? category,
            string? q,
            int? limit,
            int? offset,
            CancellationToken cancellationToken)
        {
            var rows = await dbContext.NewsArticles.AsNoTracking().ToListAsync(cancellationToken);
            var categories = await dbContext.Categories.AsNoTracking()
                .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
            var filesById = await dbContext.Files.AsNoTracking()
                .ToDictionaryAsync(x => x.Id, x => x.PublicUrl ?? x.StoragePath, cancellationToken);
            var mediaRows = await dbContext.NewsMedia.AsNoTracking()
                .OrderByDescending(x => x.MediaType == "imagen_principal")
                .ThenBy(x => x.SortOrder)
                .ToListAsync(cancellationToken);

            var mediaByNews = mediaRows
                .GroupBy(x => x.NewsId)
                .ToDictionary(
                    groupByNews => groupByNews.Key,
                    groupByNews => groupByNews
                        .Select(row => ResolveMediaUrl(row, filesById))
                        .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url)) ?? string.Empty);

            var items = rows.Select(row => ToNewsArticle(row, categories, mediaByNews)).ToList();

            if (!string.IsNullOrWhiteSpace(category))
            {
                items = items.Where(item => string.Equals(item.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(month))
            {
                items = items.Where(item => item.Date.Contains(month, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                items = items.Where(item =>
                    item.Title.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || item.Summary.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || item.Category.Contains(q, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var safeLimit = Math.Clamp(limit ?? 50, 1, 200);
            var safeOffset = Math.Max(offset ?? 0, 0);
            var page = items.Skip(safeOffset).Take(safeLimit).ToList();

            return Results.Ok(new PagedResponse<NewsArticleDto>(page, safeLimit, safeOffset, items.Count));
        }

        api.MapGet(string.Empty, listNewsAsync);
        api.MapGet("/articles", listNewsAsync);

        api.MapGet("/articles/{articleId}", async (
            string articleId,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (!int.TryParse(articleId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var articleIntId))
            {
                return Results.NotFound();
            }

            var row = await dbContext.NewsArticles.AsNoTracking().FirstOrDefaultAsync(item => item.Id == articleIntId, cancellationToken);
            if (row is null) return Results.NotFound();

            var categories = await dbContext.Categories.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
            var filesById = await dbContext.Files.AsNoTracking()
                .ToDictionaryAsync(x => x.Id, x => x.PublicUrl ?? x.StoragePath, cancellationToken);
            var mediaRows = await dbContext.NewsMedia.AsNoTracking()
                .Where(x => x.NewsId == articleIntId)
                .OrderByDescending(x => x.MediaType == "imagen_principal")
                .ThenBy(x => x.SortOrder)
                .ToListAsync(cancellationToken);

            var mediaByNews = new Dictionary<int, string>
            {
                [articleIntId] = mediaRows.Select(row => ResolveMediaUrl(row, filesById)).FirstOrDefault(url => !string.IsNullOrWhiteSpace(url)) ?? string.Empty
            };

            return Results.Ok(ToNewsArticle(row, categories, mediaByNews));
        });

        return group;
    }

    private static NewsArticleDto ToNewsArticle(
        NewsArticleRow row,
        IReadOnlyDictionary<int, string> categories,
        IReadOnlyDictionary<int, string> mediaByNews)
    {
        var dateValue = row.PublishedDate ?? row.UpdatedDate ?? row.CreatedAt;
        return new NewsArticleDto(
            row.Id.ToString(CultureInfo.InvariantCulture),
            dateValue.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ResolveCategory(row.CategoryId, categories),
            row.Title,
            row.Lead ?? string.Empty,
            HtmlSanitizer.SanitizeRichHtml(row.Body),
            mediaByNews.TryGetValue(row.Id, out var imageUrl) ? imageUrl : string.Empty
        );
    }

    private static string ResolveCategory(int? categoryId, IReadOnlyDictionary<int, string> categories)
        => categoryId.HasValue && categories.TryGetValue(categoryId.Value, out var name) ? name : string.Empty;

    private static string ResolveMediaUrl(NewsMediaRow row, IReadOnlyDictionary<int, string> filesById)
    {
        if (!string.IsNullOrWhiteSpace(row.ExternalUrl))
        {
            return row.ExternalUrl;
        }

        if (row.FileId.HasValue && filesById.TryGetValue(row.FileId.Value, out var fileUrl))
        {
            return fileUrl;
        }

        return string.Empty;
    }
}
