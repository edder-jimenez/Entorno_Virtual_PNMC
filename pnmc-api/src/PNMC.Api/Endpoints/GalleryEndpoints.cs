using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class GalleryEndpoints
{
    public static RouteGroupBuilder MapGalleryEndpoints(this RouteGroupBuilder group)
    {
        var api = group.MapGroup("/gallery").WithTags("galeria");

        api.MapGet("/albums", async (
            PnmcDbContext dbContext,
            bool? featuredOnly,
            CancellationToken cancellationToken) =>
        {
            var albums = await BuildAlbumsAsync(dbContext, cancellationToken);

            if (featuredOnly == true)
            {
                albums = albums.Where(album => album.Featured).ToList();
            }

            return Results.Ok(new { items = albums });
        });

        api.MapGet("/albums/{albumId}", async (string albumId, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var albums = await BuildAlbumsAsync(dbContext, cancellationToken);
            var album = albums.FirstOrDefault(item => string.Equals(item.Id, albumId, StringComparison.OrdinalIgnoreCase));
            return album is null ? Results.NotFound() : Results.Ok(album);
        });

        return group;
    }

    private static async Task<List<GalleryAlbumDto>> BuildAlbumsAsync(PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var files = await dbContext.Files.AsNoTracking()
            .Where(file => file.MimeType.StartsWith("image/"))
            .OrderByDescending(file => file.CreatedAt)
            .ToListAsync(cancellationToken);

        if (files.Count == 0)
        {
            return [];
        }

        var grouped = files
            .GroupBy(file => ResolveAlbumId(file.StoragePath))
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var albums = new List<GalleryAlbumDto>(grouped.Count);

        foreach (var group in grouped)
        {
            var photos = group
                .Select(file => new GalleryPhotoDto(
                    file.Id.ToString(),
                    file.PublicUrl ?? file.StoragePath,
                    file.Caption ?? file.OriginalName,
                    file.AltText ?? file.Caption ?? file.OriginalName,
                    file.Credit ?? string.Empty))
                .ToList();

            var section = new GallerySectionDto(
                $"{group.Key}-general",
                "General",
                "general",
                photos);

            var firstPhoto = photos.FirstOrDefault();
            albums.Add(new GalleryAlbumDto(
                group.Key,
                ResolveAlbumTitle(group.Key),
                "Archivo",
                string.Empty,
                string.Empty,
                string.Empty,
                false,
                firstPhoto?.Src ?? string.Empty,
                [section]));
        }

        return albums;
    }

    private static string ResolveAlbumId(string? storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)) return "general";

        var normalizedPath = storagePath.Replace('\\', '/').Trim('/');
        var segments = normalizedPath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length >= 2)
        {
            return segments[^2].Trim().Length == 0 ? "general" : segments[^2].Trim().ToLowerInvariant();
        }

        return "general";
    }

    private static string ResolveAlbumTitle(string albumId)
    {
        if (string.IsNullOrWhiteSpace(albumId) || albumId.Equals("general", StringComparison.OrdinalIgnoreCase))
        {
            return "Galería General";
        }

        return albumId
            .Replace('-', ' ')
            .Replace('_', ' ')
            .Trim();
    }
}
