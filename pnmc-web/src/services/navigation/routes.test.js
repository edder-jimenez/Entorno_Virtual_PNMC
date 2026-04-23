import {
  PAGE_IDS,
  getComponentIdFromPageId,
  getPageIdFromPath,
  getPathForPageId,
  isComponentPageId,
  toComponentPageId,
} from './routes.js';

describe('navigation routes', () => {
  it('mapea páginas estáticas a rutas limpias', () => {
    expect(getPathForPageId(PAGE_IDS.home)).toBe('/');
    expect(getPathForPageId(PAGE_IDS.mapa)).toBe('/mapa');
    expect(getPathForPageId(PAGE_IDS.mapaParticipa)).toBe('/mapa/participa');
  });

  it('mapea páginas de componente con parámetro dinámico', () => {
    const pageId = toComponentPageId('c2-3');
    const path = getPathForPageId(pageId);

    expect(path).toBe('/ejes/componentes/c2-3');
    expect(getPageIdFromPath(path)).toBe(pageId);
    expect(isComponentPageId(pageId)).toBe(true);
    expect(getComponentIdFromPageId(pageId)).toBe('c2-3');
  });

  it('cae a home para rutas desconocidas', () => {
    expect(getPageIdFromPath('/ruta-inexistente')).toBe(PAGE_IDS.home);
  });

  it('resuelve rutas cuando existe un prefijo base', () => {
    expect(getPageIdFromPath('/app/pnmc')).toBe(PAGE_IDS.pnmc);
    expect(getPageIdFromPath('/app/mapa/participa')).toBe(PAGE_IDS.mapaParticipa);
    expect(getPageIdFromPath('/app/ejes/componentes/c2-3')).toBe('comp-c2-3');
  });
});
