import { buildApiUrl, fetchApiJson } from '../http/apiClient.js';

const DATA_API_CONFIG = {
  tables: {
    agenda: 'Agenda',
    news: 'Noticias',
    festivals: 'Festivales',
    schools: 'escuelas',
    markets: 'Mercados',
    networks: 'Redes',
    lutiers: 'Lutieres',
  },
};

const REQUEST_CACHE_TTL_MS = 15 * 1000;
const inFlightRequests = new Map();
const resolvedCache = new Map();

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const clonePayload = (value) => (
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const trimText = (value) => (typeof value === 'string' ? value.trim() : '');

const mapPagingParams = (params = {}) => {
  const limit = toNumber(params.limit ?? params.pageSize ?? params.maxRecords ?? 100, 100);
  const offset = toNumber(params.offset ?? 0, 0);

  return {
    limit: Math.max(1, Math.min(limit, 500)),
    offset: Math.max(0, offset),
  };
};

const parseIsoDate = (value = '') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      year: '2026',
      monthName: 'Enero',
      day: '01',
    };
  }

  return {
    year: String(date.getUTCFullYear()),
    monthName: MONTH_NAMES[date.getUTCMonth()] || 'Enero',
    day: String(date.getUTCDate()).padStart(2, '0'),
  };
};

const normalizePagedResponse = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { items: [], total: 0 };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = Number.isFinite(payload.total) ? payload.total : items.length;
  return { items, total };
};

const fetchJson = async (url) => {
  const now = Date.now();
  const cached = resolvedCache.get(url);
  if (cached && now - cached.timestamp < REQUEST_CACHE_TTL_MS) {
    return clonePayload(cached.payload);
  }

  if (inFlightRequests.has(url)) {
    return clonePayload(await inFlightRequests.get(url));
  }

  const requestPromise = (async () => {
    const payload = await fetchApiJson({
      path: url,
      errorFallback: 'Error al consultar backend',
    });

    resolvedCache.set(url, { timestamp: Date.now(), payload });
    return payload;
  })();

  inFlightRequests.set(url, requestPromise);

  try {
    return clonePayload(await requestPromise);
  } finally {
    inFlightRequests.delete(url);
  }
};

const mapAgendaItemsToLegacyRecords = (items = []) => (
  items.map((item) => {
    const date = parseIsoDate(item?.date);

    return {
      id: String(item?.id ?? ''),
      fields: {
        día: date.day,
        mes: date.monthName,
        año: date.year,
        time: trimText(item?.timeLabel),
        t: trimText(item?.title),
        l: trimText(item?.location) || [trimText(item?.municipality), trimText(item?.department)].filter(Boolean).join(', '),
        municipio: trimText(item?.municipality),
        departamento: trimText(item?.department),
        cat: trimText(item?.category),
        desc: trimText(item?.description),
        organizer: trimText(item?.organizer),
        link: '#',
        img: trimText(item?.imageUrl),
        Tags: Array.isArray(item?.tags) ? item.tags : [],
      },
    };
  })
);

const mapNewsItemsToLegacyRecords = (items = []) => (
  items.map((item) => ({
    id: String(item?.id ?? ''),
    fields: {
      date: trimText(item?.date),
      category: trimText(item?.category),
      title: trimText(item?.title),
      desc: trimText(item?.summary),
      img: trimText(item?.imageUrl),
      content: trimText(item?.contentHtml),
    },
  }))
);

const mapFestivalItemsToLegacyRecords = (items = []) => (
  items.map((item) => {
    const lastEditionDate = trimText(item?.lastEditionDate);
    const lastEditionDateParts = parseIsoDate(lastEditionDate);

    return {
      id: String(item?.id ?? ''),
      fields: {
        name: trimText(item?.name),
        departmentCode: trimText(item?.departmentCode),
        municipalityCode: trimText(item?.municipalityCode),
        dpt: trimText(item?.departmentName),
        departamento: trimText(item?.departmentName),
        municipio: trimText(item?.municipalityName),
        divipola: trimText(item?.municipalityCode),
        coverageLevel: trimText(item?.coverageLevel),
        desc: trimText(item?.description),
        versiones: toNumber(item?.versionsCount),
        mes_de_realización: lastEditionDate ? lastEditionDateParts.monthName : '',
        mes_de_realizacion: lastEditionDate ? lastEditionDateParts.monthName : '',
        fecha_ultima_edicion: lastEditionDate,
        organizador: trimText(item?.organizerDisplayName),
        contacto_email: trimText(item?.contactEmail),
        contacto_telefono: trimText(item?.contactPhone),
        sitio_web: trimText(item?.websiteUrl),
        ubicacion_especifica: trimText(item?.specificLocation),
        'Prácticas musicales': trimText(item?.musicalPractices),
        'Territorios sonoros': trimText(item?.sonorousTerritories),
      },
    };
  })
);

const mapSchoolItemsToLegacyRecords = (items = []) => (
  items.map((item) => ({
    id: String(item?.id ?? ''),
    fields: {
      'ID escuela': String(item?.id ?? ''),
      Estado: item?.isActiveSchool ? 'Activa' : 'Inactiva',
      departmentCode: trimText(item?.departmentCode),
      municipalityCode: trimText(item?.municipalityCode),
      Departamento: trimText(item?.departmentName),
      Municipio: trimText(item?.municipalityName),
      'Código Divipola': trimText(item?.municipalityCode),
      'Nombre de la escuela': trimText(item?.name),
      'Tipo de escuela': trimText(item?.schoolType),
      'Categoría': trimText(item?.schoolCategory),
      Cobertura: trimText(item?.coverageLevel),
      'Sede de trabajo': trimText(item?.specificLocation) || trimText(item?.addressText),
      'Naturaleza': trimText(item?.responsibleEntityDisplayName),
      'Correo institucional o de contacto': trimText(item?.contactEmail),
      'Celular o contacto del director': trimText(item?.contactPhone),
      'Cuenta con organización comunitaria': item?.hasCommunityOrganization ? 'Sí' : 'No',
      'Prácticas musicales': trimText(item?.musicalPractices),
      'Territorios sonoros': trimText(item?.sonorousTerritories),
      'Talleres independientes': trimText(item?.trainingProcesses),
      'Cantidad total de alumnos': toNumber(item?.studentsTotal),
      'Cantidad de agrupaciones vigentes': toNumber(item?.activeGroupsCount),
    },
  }))
);

const mapMarketItemsToLegacyRecords = (items = []) => (
  items.map((item) => ({
    id: String(item?.id ?? ''),
    fields: {
      'Nombre del mercado': trimText(item?.name),
      departmentCode: trimText(item?.departmentCode),
      municipalityCode: trimText(item?.municipalityCode),
      Departamento: trimText(item?.departmentName),
      Municipio: trimText(item?.municipalityName),
      'Cobertura del mercado': trimText(item?.coverageLevel),
      'Descripción': trimText(item?.description),
      'Periodicidad del mercado': trimText(item?.periodicity),
      'Número de versiones realizadas': toNumber(item?.editionsCount),
      '¿El mercado se realiza en el marco de algún Festival?': item?.hasAssociatedFestival ? 'Sí' : 'No',
      'Si le respuesta anterior fue Sí, señale:  \nNombre del festival o evento ': trimText(item?.associatedFestivalDisplayName),
      '¿Cuál es la entidad, organización o corporación responsable del mercado? ': trimText(item?.responsibleEntityDisplayName),
      'Fecha de realización del mercado para el 2026': trimText(item?.currentYearStartDate),
      'Ámbito del mercado': trimText(item?.scopeType),
      'Modo del mercado': trimText(item?.marketMode),
      'Ubicación específica': trimText(item?.specificLocation),
      'Prácticas musicales': trimText(item?.musicalPractices),
      'Territorios sonoros': trimText(item?.sonorousTerritories),
      'sitio_web': trimText(item?.websiteUrl || item?.website || ''),
    },
  }))
);

const mapNetworkItemsToLegacyRecords = (items = []) => (
  items.map((item) => ({
    id: String(item?.id ?? ''),
    fields: {
      name: trimText(item?.name),
      centerType: trimText(item?.organizationType),
      municipio: trimText(item?.municipalityName),
      departamento: trimText(item?.departmentName),
      deptCode: trimText(item?.departmentCode),
      divipola: trimText(item?.municipalityCode),
      descripcion: trimText(item?.description),
      desc: trimText(item?.description),
      contact: [trimText(item?.contactEmail), trimText(item?.contactPhone)].filter(Boolean).join(' · '),
      latitud: item?.latitude != null ? Number(item.latitude) : null,
      longitud: item?.longitude != null ? Number(item.longitude) : null,
      'Territorios sonoros': trimText(item?.sonorousTerritories),
      'Prácticas musicales': trimText(item?.musicalPractices),
      'sitio_web': trimText(item?.websiteUrl || item?.website || ''),
    },
  }))
);

const mapLutierItemsToLegacyRecords = (items = []) => (
  items.map((item) => ({
    id: String(item?.id ?? ''),
    fields: {
      name: trimText(item?.name),
      oficio: trimText(item?.primaryFunction),
      municipio: trimText(item?.municipalityName),
      departamento: trimText(item?.departmentName),
      deptCode: trimText(item?.departmentCode),
      divipola: trimText(item?.municipalityCode),
      descripcion: trimText(item?.description),
      desc: trimText(item?.description),
      contact: [trimText(item?.contactEmail), trimText(item?.contactPhone)].filter(Boolean).join(' · '),
      latitud: item?.latitude != null ? Number(item.latitude) : null,
      longitud: item?.longitude != null ? Number(item.longitude) : null,
      'Territorios sonoros': trimText(item?.sonorousTerritories),
      'Prácticas musicales': trimText(item?.musicalPractices),
      'sitio_web': trimText(item?.websiteUrl || item?.website || ''),
    },
  }))
);

const fetchFromBackend = async (path, params = {}) => {
  const url = buildApiUrl(path, params);
  const payload = await fetchJson(url);
  return normalizePagedResponse(payload);
};

const buildModuleUrl = (table, params = {}) => {
  const paging = mapPagingParams(params);

  switch (table) {
    case DATA_API_CONFIG.tables.agenda:
      return buildApiUrl('/api/v1/agenda/events', paging);
    case DATA_API_CONFIG.tables.news:
      return buildApiUrl('/api/v1/news/articles', paging);
    case DATA_API_CONFIG.tables.festivals:
      return buildApiUrl('/api/v1/festivals', paging);
    case DATA_API_CONFIG.tables.schools:
      return buildApiUrl('/api/v1/music-schools', paging);
    case DATA_API_CONFIG.tables.markets:
      return buildApiUrl('/api/v1/music-markets', paging);
    case DATA_API_CONFIG.tables.networks:
      return buildApiUrl('/api/v1/organizations', paging);
    case DATA_API_CONFIG.tables.lutiers:
      return buildApiUrl('/api/v1/spaces-infrastructure', paging);
    default:
      return buildApiUrl('/api/v1/admin/data/stats');
  }
};

export const fetchModuleRecords = async (table, params = {}) => {
  const paging = mapPagingParams(params);

  if (table === DATA_API_CONFIG.tables.agenda) {
    const { items } = await fetchFromBackend('/api/v1/agenda/events', paging);
    return { records: mapAgendaItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.news) {
    const { items } = await fetchFromBackend('/api/v1/news/articles', paging);
    return { records: mapNewsItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.festivals) {
    const { items } = await fetchFromBackend('/api/v1/festivals', paging);
    return { records: mapFestivalItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.schools) {
    const { items } = await fetchFromBackend('/api/v1/music-schools', paging);
    return { records: mapSchoolItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.markets) {
    const { items } = await fetchFromBackend('/api/v1/music-markets', paging);
    return { records: mapMarketItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.networks) {
    const { items } = await fetchFromBackend('/api/v1/organizations', paging);
    return { records: mapNetworkItemsToLegacyRecords(items) };
  }

  if (table === DATA_API_CONFIG.tables.lutiers) {
    const { items } = await fetchFromBackend('/api/v1/spaces-infrastructure', paging);
    return { records: mapLutierItemsToLegacyRecords(items) };
  }

  return { records: [] };
};

export const fetchPaginatedModuleRecords = async (table, params = {}) => fetchModuleRecords(table, params);

export const fetchAgendaRecords = (params = {}) => fetchModuleRecords(DATA_API_CONFIG.tables.agenda, params);
export const fetchNewsRecords = (params = {}) => fetchModuleRecords(DATA_API_CONFIG.tables.news, params);
export const fetchFestivalRecords = (params = {}) => fetchModuleRecords(DATA_API_CONFIG.tables.festivals, params);
export const fetchSchoolRecords = (params = {}) => fetchPaginatedModuleRecords(DATA_API_CONFIG.tables.schools, params);
export const fetchMarketRecords = (params = {}) => fetchPaginatedModuleRecords(DATA_API_CONFIG.tables.markets, params);
export const fetchNetworkRecords = (params = {}) => fetchPaginatedModuleRecords(DATA_API_CONFIG.tables.networks, params);
export const fetchLutierRecords = (params = {}) => fetchPaginatedModuleRecords(DATA_API_CONFIG.tables.lutiers, params);

export { DATA_API_CONFIG, buildModuleUrl };
