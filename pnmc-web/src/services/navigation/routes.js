export const PAGE_IDS = {
  home: 'home',
  pnmc: 'pnmc',
  ejes: 'ejes',
  editorial: 'editorial',
  galeria: 'galeria',
  noticias: 'noticias',
  agenda: 'agenda',
  mapa: 'mapa',
  mapaParticipa: 'mapa-participa',
  admin: 'admin',
  colaboradores: 'colaboradores',
  estrategiaCirculacion: 'estrategia-circulacion',
  estrategiaInvestigacion: 'estrategia-investigacion',
};

export const COMPONENT_PAGE_PREFIX = 'comp-';

export const PAGE_PATHS = {
  [PAGE_IDS.home]: '/',
  [PAGE_IDS.pnmc]: '/pnmc',
  [PAGE_IDS.ejes]: '/ejes',
  [PAGE_IDS.editorial]: '/editorial',
  [PAGE_IDS.galeria]: '/galeria',
  [PAGE_IDS.noticias]: '/noticias',
  [PAGE_IDS.agenda]: '/agenda',
  [PAGE_IDS.mapa]: '/mapa',
  [PAGE_IDS.mapaParticipa]: '/mapa/participa',
  [PAGE_IDS.admin]: '/admin',
  [PAGE_IDS.colaboradores]: '/colaboradores',
  [PAGE_IDS.estrategiaCirculacion]: '/estrategia/circulacion',
  [PAGE_IDS.estrategiaInvestigacion]: '/estrategia/investigacion',
};

export const NAVIGATION_LINKS = [
  { name: 'Sobre el PNMC', id: PAGE_IDS.pnmc },
  { name: 'Ejes', id: PAGE_IDS.ejes },
  { name: 'Editorial', id: PAGE_IDS.editorial },
  { name: 'Galería', id: PAGE_IDS.galeria },
  { name: 'Noticias', id: PAGE_IDS.noticias },
  { name: 'Agenda', id: PAGE_IDS.agenda },
  { name: 'Mapa Ecosistémico', id: PAGE_IDS.mapa },
];

const normalizePathname = (pathname = '/') => {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

export const getPageIdFromPath = (pathname = '/') => {
  const normalizedPath = normalizePathname(pathname);

  const pathSegments = normalizedPath.split('/').filter(Boolean);
  const ejesIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === 'ejes');
  if (ejesIndex !== -1 && pathSegments[ejesIndex + 1]?.toLowerCase() === 'componentes' && pathSegments[ejesIndex + 2]) {
    return `${COMPONENT_PAGE_PREFIX}${decodeURIComponent(pathSegments[ejesIndex + 2])}`;
  }

  const staticEntries = Object.entries(PAGE_PATHS)
    .filter(([, pagePath]) => pagePath !== '/')
    .sort(([, leftPath], [, rightPath]) => rightPath.length - leftPath.length);

  const staticMatch = staticEntries.find(([, pagePath]) => (
    normalizedPath === pagePath || normalizedPath.endsWith(pagePath)
  ));

  return staticMatch?.[0] || PAGE_IDS.home;
};

export const getPathForPageId = (pageId = PAGE_IDS.home) => {
  if (!pageId || typeof pageId !== 'string') return PAGE_PATHS[PAGE_IDS.home];

  if (pageId.startsWith(COMPONENT_PAGE_PREFIX)) {
    const componentId = pageId.slice(COMPONENT_PAGE_PREFIX.length);
    return componentId ? `/ejes/componentes/${encodeURIComponent(componentId)}` : PAGE_PATHS[PAGE_IDS.ejes];
  }

  return PAGE_PATHS[pageId] || PAGE_PATHS[PAGE_IDS.home];
};

export const isComponentPageId = (pageId = '') => pageId.startsWith(COMPONENT_PAGE_PREFIX);

export const toComponentPageId = (componentId = '') => `${COMPONENT_PAGE_PREFIX}${componentId}`;

export const getComponentIdFromPageId = (pageId = '') => (
  isComponentPageId(pageId) ? pageId.slice(COMPONENT_PAGE_PREFIX.length) : null
);
