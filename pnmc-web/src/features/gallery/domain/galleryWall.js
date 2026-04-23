const GALLERY_DOWNLOAD_PREFIX = 'pnmc-galeria';
const GALLERY_WALL_SLOT_COUNT = 12;
const GALLERY_WALL_SWAP_INTERVAL_MS = 15000;
const GALLERY_WALL_FADE_OUT_MS = 820;
const GALLERY_WALL_FADE_IN_MS = 1450;
const GALLERY_WALL_LAYOUT_PATTERNS = [
  'col-span-1 row-span-1 md:col-span-2 md:row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1 md:col-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
];

const sanitizeGalleryFileToken = (value = '') => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
);

const buildGalleryDownloadName = (photo, index) => {
  const extensionMatch = String(photo?.src || '').match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const extension = extensionMatch?.[1] || 'jpg';
  const titleToken = sanitizeGalleryFileToken(photo?.title) || `imagen-${index + 1}`;
  return `${GALLERY_DOWNLOAD_PREFIX}-${titleToken}.${extension}`;
};

export {
  GALLERY_WALL_SLOT_COUNT,
  GALLERY_WALL_SWAP_INTERVAL_MS,
  GALLERY_WALL_FADE_OUT_MS,
  GALLERY_WALL_FADE_IN_MS,
  GALLERY_WALL_LAYOUT_PATTERNS,
  buildGalleryDownloadName,
};
