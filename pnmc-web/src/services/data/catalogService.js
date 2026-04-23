import { feature as topojsonFeature } from 'topojson-client';

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const GALLERY_MANIFEST_PATH = '/api/v1/gallery/albums';
const TOPOLOGY_DEPARTMENTS_OBJECT = 'MGN_ADM_DPTO_POLITICO';
const TOPOLOGY_MUNICIPALITIES_OBJECT = 'MGN_ADM_MPIO_GRAFICO';

const buildUrl = (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const base = API_BASE_URL || '';
  return `${base}${path}${query ? `?${query}` : ''}`;
};

const fetchJson = async (path, params = {}) => {
  const response = await fetch(buildUrl(path, params), { cache: 'no-store' });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.title || `No fue posible cargar datos (${response.status}).`);
  }

  return payload;
};

const normalizeDepartmentCode = (value) => {
  const digits = String(value ?? '').replace(/\D+/g, '');
  if (!digits) return '';
  return digits.padStart(2, '0').slice(-2);
};

const normalizeMunicipalityCode = (value, departmentCode = '', municipalityShortCode = '') => {
  const valueDigits = String(value ?? '').replace(/\D+/g, '');
  if (valueDigits.length >= 5) return valueDigits.slice(-5);

  const departmentDigits = normalizeDepartmentCode(departmentCode);
  const municipalityDigits = String(municipalityShortCode ?? '').replace(/\D+/g, '').padStart(3, '0').slice(-3);

  if (departmentDigits && municipalityDigits) {
    return `${departmentDigits}${municipalityDigits}`;
  }

  return valueDigits || '';
};

const ensureFeatureCollection = (value) => {
  if (value?.type === 'FeatureCollection' && Array.isArray(value.features)) {
    return value;
  }

  return { type: 'FeatureCollection', features: [] };
};

const normalizeDepartmentFeatureCollection = (collection) => {
  const normalized = ensureFeatureCollection(collection);

  return {
    ...normalized,
    features: normalized.features.map((item) => {
      const properties = item?.properties || {};
      const departmentCode = normalizeDepartmentCode(properties.departmentCode || properties.dpto_ccdgo);
      const departmentName = properties.departmentName || properties.dpto_cnmbr || '';

      return {
        ...item,
        properties: {
          ...properties,
          departmentCode,
          departmentName,
        },
      };
    }),
  };
};

const normalizeMunicipalityFeatureCollection = (collection) => {
  const normalized = ensureFeatureCollection(collection);

  return {
    ...normalized,
    features: normalized.features.map((item) => {
      const properties = item?.properties || {};
      const departmentCode = normalizeDepartmentCode(properties.departmentCode || properties.dpto_ccdgo);
      const municipalityCode = normalizeMunicipalityCode(
        properties.municipalityCode || properties.mpio_cdpmp,
        departmentCode,
        properties.municipalityShortCode || properties.mpio_ccdgo
      );
      const municipalityShortCode = String(
        properties.municipalityShortCode || properties.mpio_ccdgo || ''
      ).replace(/\D+/g, '').padStart(3, '0').slice(-3);
      const municipalityName = properties.municipalityName || properties.mpio_cnmbr || '';
      const departmentName = properties.departmentName || properties.dpto_cnmbr || '';

      return {
        ...item,
        properties: {
          ...properties,
          departmentCode,
          departmentName,
          municipalityCode,
          municipalityShortCode,
          municipalityName,
        },
      };
    }),
  };
};

const toGeoBundleFromTopology = (topologyPayload) => {
  const topologyObjects = topologyPayload?.objects || {};
  const departmentsObject = topologyObjects[TOPOLOGY_DEPARTMENTS_OBJECT];
  const municipalitiesObject = topologyObjects[TOPOLOGY_MUNICIPALITIES_OBJECT];

  const departments = normalizeDepartmentFeatureCollection(
    departmentsObject
      ? topojsonFeature(topologyPayload, departmentsObject)
      : { type: 'FeatureCollection', features: [] }
  );

  const municipalities = normalizeMunicipalityFeatureCollection(
    municipalitiesObject
      ? topojsonFeature(topologyPayload, municipalitiesObject)
      : { type: 'FeatureCollection', features: [] }
  );

  return {
    departments,
    municipalities,
  };
};

export const fetchEditorialCatalog = async () => {
  const payload = await fetchJson('/api/v1/editorial/resources', { limit: 500, offset: 0 });
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
};

export const fetchColombiaGeoJson = async () => {
  const payload = await fetchJson('/api/v1/map/topojson/territories');

  if (payload?.type === 'Topology') {
    const geoBundle = toGeoBundleFromTopology(payload);
    return {
      ...geoBundle.departments,
      municipalities: geoBundle.municipalities,
      sourceFormat: 'topojson',
    };
  }

  if (payload?.type === 'FeatureCollection') {
    return {
      ...normalizeDepartmentFeatureCollection(payload),
      municipalities: { type: 'FeatureCollection', features: [] },
      sourceFormat: 'geojson',
    };
  }

  return {
    type: 'FeatureCollection',
    features: [],
    municipalities: { type: 'FeatureCollection', features: [] },
    sourceFormat: 'unknown',
  };
};

export const fetchGalleryAlbums = async () => {
  const payload = await fetchJson('/api/v1/gallery/albums');
  return Array.isArray(payload?.items) ? payload.items : [];
};

export const fetchDivipolaGrouped = async () => {
  const payload = await fetchJson('/api/v1/divipola/grouped');
  return payload && typeof payload === 'object' ? payload : {};
};

export { GALLERY_MANIFEST_PATH };
