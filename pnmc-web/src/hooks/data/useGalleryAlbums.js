import { useCallback } from 'react';
import { fetchGalleryAlbums } from '../../services/data/index.js';
import { useAsyncResource } from './useAsyncResource.js';

const normalizeText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeGalleryAlbums = (albums = []) => {
  if (!Array.isArray(albums)) return [];

  return albums
    .map((album, albumIndex) => {
      const albumId = normalizeText(album?.id, `album-${albumIndex + 1}`);
      const albumTitle = normalizeText(album?.title, `Álbum ${albumIndex + 1}`);

      const sourceSections = Array.isArray(album?.sections) && album.sections.length > 0
        ? album.sections
        : [{
            id: 'general',
            title: 'General',
            type: 'general',
            photos: Array.isArray(album?.photos) ? album.photos : [],
          }];

      const sections = sourceSections.map((section, sectionIndex) => {
        const sectionId = normalizeText(section?.id, `${albumId}-section-${sectionIndex + 1}`);
        const sectionTitle = normalizeText(section?.title, `Sección ${sectionIndex + 1}`);
        const sectionType = normalizeText(section?.type, 'general');
        const sectionPhotos = Array.isArray(section?.photos) ? section.photos : [];

        const photos = sectionPhotos
          .map((photo, photoIndex) => {
            const src = normalizeText(photo?.src);
            if (!src) return null;

            const title = normalizeText(photo?.title, `${albumTitle} · ${sectionTitle} · Foto ${photoIndex + 1}`);

            return {
              id: normalizeText(photo?.id, `${albumId}-${sectionId}-${photoIndex + 1}`),
              src,
              title,
              alt: normalizeText(photo?.alt, title),
              description: normalizeText(photo?.description, ''),
              sectionId,
              sectionTitle,
              sectionType,
            };
          })
          .filter(Boolean);

        return {
          id: sectionId,
          title: sectionTitle,
          type: sectionType,
          photos,
        };
      }).filter((section) => section.photos.length > 0);

      const photos = sections.flatMap((section) => section.photos);
      const cover = normalizeText(
        album?.cover,
        photos[0]?.src || '',
      );

      return {
        id: albumId,
        title: albumTitle,
        category: normalizeText(album?.category, 'Archivo'),
        description: normalizeText(album?.description, ''),
        location: normalizeText(album?.location, ''),
        dateLabel: normalizeText(album?.dateLabel, ''),
        featured: Boolean(album?.featured),
        cover,
        sections,
        photos,
        photoCount: photos.length,
      };
    })
    .filter((album) => album.photos.length > 0 || album.cover);
};

export const useGalleryAlbums = ({
  loader = fetchGalleryAlbums,
  deps = [],
  enabled = true,
} = {}) => {
  const stableLoader = useCallback(async () => {
    const payload = await loader();
    return normalizeGalleryAlbums(payload);
  }, [loader]);

  const resource = useAsyncResource({
    loader: stableLoader,
    deps,
    enabled,
    initialData: [],
  });

  return {
    ...resource,
    albums: Array.isArray(resource.data) ? resource.data : [],
  };
};

export default useGalleryAlbums;
