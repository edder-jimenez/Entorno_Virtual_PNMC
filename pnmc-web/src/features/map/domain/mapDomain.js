let runtimeDivipolaByDepartment = {};
let runtimeDepartmentNameByCode = {};
const getRuntimeDivipolaByDepartment = () => runtimeDivipolaByDepartment;
const setRuntimeDivipolaByDepartment = (nextValue) => {
  runtimeDivipolaByDepartment = nextValue && typeof nextValue === 'object'
    ? nextValue
    : {};
};
const normalizeDepartmentCode = (value = '') => {
  const digits = String(value).replace(/\D+/g, '');
  if (!digits) return '';
  return digits.padStart(2, '0').slice(-2);
};
const normalizeMunicipalityCode = (value = '') => {
  const digits = String(value).replace(/\D+/g, '');
  if (!digits) return '';
  return digits.padStart(5, '0').slice(-5);
};
const setRuntimeDepartmentCatalog = (features = []) => {
  const departmentNameByCode = {};
  const departmentCodeByNormalizedName = {};

  (Array.isArray(features) ? features : []).forEach((feature) => {
    const properties = feature?.properties || {};
    const departmentCode = normalizeDepartmentCode(
      properties.departmentCode || properties.dpto_ccdgo
    );
    const departmentName = String(
      properties.departmentName || properties.dpto_cnmbr || ''
    ).trim();

    if (!departmentCode || !departmentName) return;

    departmentNameByCode[departmentCode] = departmentName;
    departmentCodeByNormalizedName[normalizeDepartmentName(departmentName)] = departmentCode;
  });

  Object.keys(getRuntimeDivipolaByDepartment()).forEach((departmentName) => {
    const normalizedName = normalizeDepartmentName(departmentName);
    const knownCode = departmentCodeByNormalizedName[normalizedName];
    if (!knownCode) return;
    if (!departmentNameByCode[knownCode]) {
      departmentNameByCode[knownCode] = departmentName;
    }
  });

  runtimeDepartmentNameByCode = departmentNameByCode;
};
const getDepartmentNameByCode = (departmentCode = '') => (
  runtimeDepartmentNameByCode[normalizeDepartmentCode(departmentCode)] || ''
);
const getSortedDepartmentNames = () => (
  Object.keys(getRuntimeDivipolaByDepartment())
    .sort((left, right) => left.localeCompare(right, 'es-CO'))
);

const GEOJSON_DEPARTMENT_NAME_KEYS = ['departmentName', 'dpto_cnmbr', 'DPTO_CNMBR', 'dpt', 'NOMBRE_DPT', 'name'];
const GEOJSON_DEPARTMENT_CODE_KEYS = ['departmentCode', 'dpto_ccdgo', 'DPTO_CCDGO', 'code'];
const FESTIVAL_COUNTS_CACHE_KEY = 'pnmc-festival-counts-cache-v1';
const SCHOOL_COUNTS_CACHE_KEY = 'pnmc-school-counts-cache-v1';
const MARKET_COUNTS_CACHE_KEY = 'pnmc-market-counts-cache-v1';
const NAVBAR_SCROLL_OFFSET = 112;
const ARCHIPELAGO_NORMALIZED_NAME = 'SAN ANDRES Y PROVIDENCIA';
const ARCHIPELAGO_VISUAL_SCALE = 8.5;
const METRIC_FORMATTER = new Intl.NumberFormat('es-CO');
const DEPARTMENT_NAME_ALIASES = {
  'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SAN ANDRES Y PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SANTAFE DE BOGOTA': 'BOGOTA',
  'BOGOTA D C': 'BOGOTA',
  'BOGOTA D.C': 'BOGOTA',
  'BOGOTA, D.C.': 'BOGOTA',
  'DISTRITO CAPITAL DE BOGOTA': 'BOGOTA',
  'CUNDINAMRCA': 'CUNDINAMARCA',
};

const MAP_LAYER_CHOROPLETH_STEPS = {
  General: [
    { min: 1, max: 5, color: '#bbf7d0', opacity: 0.62, label: '1 a 5' },
    { min: 6, max: 10, color: '#86efac', opacity: 0.72, label: '6 a 10' },
    { min: 11, max: 15, color: '#4ade80', opacity: 0.8, label: '11 a 15' },
    { min: 16, max: 20, color: '#16a34a', opacity: 0.88, label: '16 a 20' },
    { min: 21, max: Infinity, color: '#14532d', opacity: 0.94, label: '20 o más' },
  ],
  Festivales: [
    { min: 1, max: 5, color: '#bbf7d0', opacity: 0.62, label: '1 a 5' },
    { min: 6, max: 10, color: '#86efac', opacity: 0.72, label: '6 a 10' },
    { min: 11, max: 15, color: '#4ade80', opacity: 0.8, label: '11 a 15' },
    { min: 16, max: 20, color: '#16a34a', opacity: 0.88, label: '16 a 20' },
    { min: 21, max: Infinity, color: '#14532d', opacity: 0.94, label: '20 o más' },
  ],
  'Escuelas de Música': [
    { min: 1, max: 5, color: '#bbf7d0', opacity: 0.62, label: '1 a 5' },
    { min: 6, max: 10, color: '#86efac', opacity: 0.72, label: '6 a 10' },
    { min: 11, max: 15, color: '#4ade80', opacity: 0.8, label: '11 a 15' },
    { min: 16, max: 20, color: '#16a34a', opacity: 0.88, label: '16 a 20' },
    { min: 21, max: Infinity, color: '#14532d', opacity: 0.94, label: '20 o más' },
  ],
  'Mercados Musicales': [
    { min: 1, max: 5, color: '#bbf7d0', opacity: 0.62, label: '1 a 5' },
    { min: 6, max: 10, color: '#86efac', opacity: 0.72, label: '6 a 10' },
    { min: 11, max: 15, color: '#4ade80', opacity: 0.8, label: '11 a 15' },
    { min: 16, max: 20, color: '#16a34a', opacity: 0.88, label: '16 a 20' },
    { min: 21, max: Infinity, color: '#14532d', opacity: 0.94, label: '20 o más' },
  ],
};

const EMPTY_DEPARTMENT_SUMMARY = {
  festivalCount: 0,
  schoolCount: 0,
  marketCount: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalInstruments: 0,
  totalGroups: 0,
  totalMarketProjects: 0,
  totalMarketBuyers: 0,
  totalRecords: 0,
};

const SCHOOL_FIELD_MAP = {
  id: ['ID escuela'],
  referenceYear: ['Año de referencia', 'Ano de referencia'],
  status: ['Estado'],
  departmentCode: ['departmentCode', 'Codigo Departamento', 'Código Departamento', 'Departamento Código Divipola'],
  municipalityCode: ['municipalityCode', 'Código Divipola', 'Codigo Divipola'],
  department: ['Departamento'],
  municipality: ['Municipio'],
  divipola: ['Código Divipola', 'Codigo Divipola'],
  name: ['Nombre de la escuela'],
  address: ['Dirección de la escuela', 'Direccion de la escuela'],
  schoolType: ['Tipo de escuela'],
  category: ['Categoría', 'Categoria'],
  categorizationDate: ['Fecha de categorización', 'Fecha de categorizacion'],
  legalCreation: ['Escuela creada legalmente'],
  legalPersonhood: ['Tiene personería jurídica', 'Tiene personeria jurídica', 'Tiene personeria juridica'],
  nature: ['Naturaleza'],
  dependsOnEntity: ['Depende de otra entidad'],
  parentEntity: ['Entidad de la que depende'],
  directorName: ['Nombre del director o coordinador'],
  directorContact: ['Celular o contacto del director'],
  contactEmail: ['Correo institucional o de contacto'],
  workSite: ['Sede de trabajo'],
  internetAccess: ['Tiene acceso a internet'],
  instruments: ['Cantidad total de instrumentos'],
  teachers: ['Cantidad total de docentes vinculados'],
  students: ['Cantidad total de alumnos'],
  groups: ['Cantidad de agrupaciones vigentes'],
  practices: ['Prácticas musicales', 'Practicas musicales'],
  workshops: ['Talleres independientes'],
  communityOrganization: ['Cuenta con organización comunitaria', 'Cuenta con organizacion comunitaria'],
  observations: ['Observaciones'],
};

const SCHOOL_PUBLICATION_POLICY = {
  public: [
    'status',
    'department',
    'municipality',
    'divipola',
    'name',
    'schoolType',
    'category',
    'legalCreation',
    'legalPersonhood',
    'nature',
    'dependsOnEntity',
    'parentEntity',
    'workSite',
    'internetAccess',
    'instruments',
    'teachers',
    'students',
    'groups',
    'practices',
    'workshops',
    'communityOrganization',
  ],
  private: [
    'id',
    'referenceYear',
    'address',
    'categorizationDate',
    'directorName',
    'directorContact',
    'contactEmail',
    'observations',
  ],
};

const MARKET_FIELD_MAP = {
  name: ['\uFEFFMarca temporal', 'Marca temporal', 'Nombre del mercado', 'Mercado', 'name', 'nombre'],
  departmentCode: ['departmentCode', 'Codigo Departamento', 'Código Departamento'],
  municipalityCode: ['municipalityCode', 'Código Divipola', 'Codigo Divipola'],
  department: ['Departamento donde se realiza', 'Departamento', 'departamento'],
  municipality: ['Ciudad donde se realiza', 'Ciudad', 'Municipio', 'municipio'],
  createdYear: ['Año de creación del mercado ', 'Año de creación del mercado', 'Ano de creación del mercado', 'Ano de creacion del mercado'],
  versions: ['Número de versiones realizadas ', 'Número de versiones realizadas', 'Numero de versiones realizadas'],
  periodicity: ['Periodicidad del mercado ', 'Periodicidad del mercado'],
  editionDate2026: ['Fecha de realización del mercado para el 2026', 'Fecha de realizacion del mercado para el 2026'],
  responsibleEntity: ['¿Cuál es la entidad, organización o corporación responsable del mercado? ', '¿Cuál es la entidad, organización o corporación responsable del mercado?'],
  organizationType: ['Tipo de organización', 'Tipo de organizacion'],
  legalFormalStatus: ['¿Esta entidad u organización cuenta con constitución legal formal? ', '¿Esta entidad u organización cuenta con constitución legal formal?'],
  legalEntityNit: ['Si le respuesta anterior fue Sí, señale: Nombre de la entidad u organización y NIT'],
  linkedFestival: ['¿El mercado se realiza en el marco de algún Festival?', '¿El mercado se realiza en el marco de algún Festival? '],
  festivalName: ['Si le respuesta anterior fue Sí, señale:  \nNombre del festival o evento ', 'Si le respuesta anterior fue Sí, señale: Nombre del festival o evento'],
  festivalVersions: ['¿Cuántas versiones lleva el festival? ', '¿Cuántas versiones lleva el festival?'],
  festivalDates: ['Fechas aproximadas del festival cada año'],
  fundingSources: ['¿Cuáles son las principales fuentes de financiación del mercado o festival?\n(marque las que correspondan) ', '¿Cuáles son las principales fuentes de financiación del mercado o festival?'],
  publicBudgetShare: ['Aproximadamente, ¿Qué porcentaje del presupuesto proviene de recursos públicos? ', 'Aproximadamente, ¿Qué porcentaje del presupuesto proviene de recursos públicos?'],
  curationModel: ['¿Cómo se define la curaduría o selección de artistas y proyectos musicales del mercado y/o festival? ', '¿Cómo se define la curaduría o selección de artistas y proyectos musicales del mercado y/o festival?'],
  openCall: ['¿El mercado cuenta con convocatoria abierta para artistas o proyectos musicales? ', '¿El mercado cuenta con convocatoria abierta para artistas o proyectos musicales?'],
  averageProjects: ['¿Cuántos proyectos musicales participan en promedio en cada edición? ', '¿Cuántos proyectos musicales participan en promedio en cada edición?'],
  averageBuyers: ['¿Cuántos bookers, programadores o compradores participan en promedio en cada edición del mercado? ', '¿Cuántos bookers, programadores o compradores participan en promedio en cada edición del mercado?'],
  buyerSpaces: ['¿De qué tipo de espacios provienen principalmente estos agentes? ', '¿De qué tipo de espacios provienen principalmente estos agentes?'],
  buyerStrategies: ['¿Qué estrategias utiliza el mercado para asegurar la participación de bookers o compradores?  (ejemplo: invitaciones directas, alianzas, bolsas de viaje, acuerdos con festivales, etc.) ', '¿Qué estrategias utiliza el mercado para asegurar la participación de bookers o compradores?'],
  preAgreements: ['¿Los bookers invitados participan con compromisos de programación o compra previamente establecidos? ', '¿Los bookers invitados participan con compromisos de programación o compra previamente establecidos?'],
  circulationMechanisms: ['¿Qué tipo de compromisos o mecanismos se utilizan para promover la compra o circulación de artistas? ', '¿Qué tipo de compromisos o mecanismos se utilizan para promover la compra o circulación de artistas?'],
  publicArticulations: ['¿Qué articulaciones ha tenido su mercado con entidades públicas?\n(Ejemplo: ministerios, gobernaciones, alcaldías, institutos culturales) ', '¿Qué articulaciones ha tenido su mercado con entidades públicas?'],
  partnerNetworks: ['¿Con qué otras organizaciones o redes culturales trabaja actualmente? ', '¿Con qué otras organizaciones o redes culturales trabaja actualmente?'],
  pnmcConnections: ['¿Los Encuentros de Mercados realizados en marzo y noviembre de 2025, en el marco de la estrategia de articulación del Plan Nacional de Música para la Convivencia (PNMC), dieron lugar a nuevos vínculos o colaboraciones con otros mercados, circuitos o...'],
  pnmcConnectionsDetail: ['Si en la pregunta anterior respondió “Sí”, por favor describa el vínculo o colaboración generada, indicando: ¿con qué mercado, festival o circuito se estableció la articulación?, ¿qué artistas o proyectos musicales estuvieron involucrados?, ¿en qué...'],
  collaborationPotential: ['  ¿Qué tipo de acciones o colaboraciones considera posibles desarrollar con otros mercados de su territorio o región?  ', '¿Qué tipo de acciones o colaboraciones considera posibles desarrollar con otros mercados de su territorio o región?'],
  territorialImpact: ['¿Cuáles considera que son los principales aportes de su mercado a la circulación musical en su territorio? ', '¿Cuáles considera que son los principales aportes de su mercado a la circulación musical en su territorio?'],
};

const MARKET_PUBLICATION_POLICY = {
  public: [
    'name',
    'department',
    'municipality',
    'createdYear',
    'versions',
    'periodicity',
    'editionDate2026',
    'responsibleEntity',
    'organizationType',
    'legalFormalStatus',
    'linkedFestival',
    'festivalName',
    'festivalVersions',
    'festivalDates',
    'fundingSources',
    'publicBudgetShare',
    'curationModel',
    'openCall',
    'averageProjects',
    'averageBuyers',
    'buyerSpaces',
    'buyerStrategies',
    'preAgreements',
    'circulationMechanisms',
    'publicArticulations',
    'partnerNetworks',
    'pnmcConnections',
    'pnmcConnectionsDetail',
    'collaborationPotential',
    'territorialImpact',
  ],
  private: [
    'legalEntityNit',
  ],
};

const normalizeDepartmentName = (str) => {
  const normalized = str?.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+D\s+C\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';

  return DEPARTMENT_NAME_ALIASES[normalized] || normalized;
};

const normalizeMunicipalityName = (str = '') => String(str)
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\./g, ' ')
  .replace(/,/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sortUniqueByLocale = (values = []) => (
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, 'es-CO'))
);

const getDepartmentDisplayName = (value = '') => {
  const departmentCode = normalizeDepartmentCode(value);
  if (departmentCode) {
    const fromCode = getDepartmentNameByCode(departmentCode);
    if (fromCode) return fromCode;
  }

  const normalized = normalizeDepartmentName(value);

  if (!normalized) return 'Sin departamento';
  if (normalized === ARCHIPELAGO_NORMALIZED_NAME) {
    return 'Archipiélago de San Andrés, Providencia y Santa Catalina';
  }
  if (normalized === 'BOGOTA') {
    return 'Bogotá D.C.';
  }

  return Object.keys(getRuntimeDivipolaByDepartment()).find(
    (departmentName) => normalizeDepartmentName(departmentName) === normalized
  ) || value;
};

const getDepartmentSelectionValue = (value = '') => {
  const departmentCode = normalizeDepartmentCode(value);
  if (departmentCode) {
    const fromCode = getDepartmentNameByCode(departmentCode);
    if (fromCode) return fromCode;
  }

  const normalized = normalizeDepartmentName(value);

  if (!normalized) return value;
  if (normalized === ARCHIPELAGO_NORMALIZED_NAME) {
    return 'San Andrés y Providencia';
  }
  if (normalized === 'BOGOTA') {
    return 'Bogotá D.C.';
  }

  return Object.keys(getRuntimeDivipolaByDepartment()).find(
    (departmentName) => normalizeDepartmentName(departmentName) === normalized
  ) || value;
};

const resolveDepartmentDivipolaKey = (value = '') => {
  const grouped = getRuntimeDivipolaByDepartment();

  if (!value) return '';
  if (Array.isArray(grouped[value])) return value;

  const selectionValue = getDepartmentSelectionValue(value);
  if (selectionValue && Array.isArray(grouped[selectionValue])) return selectionValue;

  const normalized = normalizeDepartmentName(selectionValue || value);
  if (!normalized) return '';

  return Object.keys(grouped).find(
    (departmentName) => normalizeDepartmentName(departmentName) === normalized
  ) || '';
};

const municipalityExistsInList = (municipality = '', municipalityList = []) => {
  const normalizedTarget = normalizeMunicipalityName(municipality);
  if (!normalizedTarget) return false;

  return (Array.isArray(municipalityList) ? municipalityList : []).some(
    (item) => normalizeMunicipalityName(item) === normalizedTarget
  );
};

const getFeatureDepartmentName = (feature) => {
  if (!feature?.properties) return 'Sin nombre';
  const departmentCode = getFeatureDepartmentCode(feature);
  const fromCode = departmentCode ? getDepartmentNameByCode(departmentCode) : '';
  if (fromCode) return fromCode;

  return GEOJSON_DEPARTMENT_NAME_KEYS.map((key) => feature.properties[key]).find(Boolean) || 'Sin nombre';
};

const getFeatureDepartmentCode = (feature) => {
  if (!feature?.properties) return '';

  const rawCode = GEOJSON_DEPARTMENT_CODE_KEYS
    .map((key) => feature.properties[key])
    .find((value) => value !== undefined && value !== null && String(value).trim() !== '');

  return normalizeDepartmentCode(rawCode || '');
};

const getFeatureDepartmentNormalizedName = (feature) => {
  const featureDepartmentCode = getFeatureDepartmentCode(feature);
  if (featureDepartmentCode) {
    const mappedName = getDepartmentNameByCode(featureDepartmentCode);
    if (mappedName) {
      return normalizeDepartmentName(mappedName);
    }
  }

  return normalizeDepartmentName(getFeatureDepartmentName(feature));
};

const mapCoordinatesDeep = (coordinates, transformPoint) => {
  if (!Array.isArray(coordinates)) return coordinates;
  if (typeof coordinates[0] === 'number') {
    return transformPoint(coordinates);
  }
  return coordinates.map((value) => mapCoordinatesDeep(value, transformPoint));
};

const getCoordinatesBounds = (coordinates, bounds = {
  minLng: Infinity,
  maxLng: -Infinity,
  minLat: Infinity,
  maxLat: -Infinity,
}) => {
  if (!Array.isArray(coordinates)) return bounds;

  if (typeof coordinates[0] === 'number') {
    const [lng, lat] = coordinates;
    return {
      minLng: Math.min(bounds.minLng, lng),
      maxLng: Math.max(bounds.maxLng, lng),
      minLat: Math.min(bounds.minLat, lat),
      maxLat: Math.max(bounds.maxLat, lat),
    };
  }

  return coordinates.reduce(
    (acc, value) => getCoordinatesBounds(value, acc),
    bounds
  );
};

const buildScaledFeature = (feature, scale = ARCHIPELAGO_VISUAL_SCALE) => {
  if (!feature?.geometry?.coordinates) return null;

  const bounds = getCoordinatesBounds(feature.geometry.coordinates);
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: mapCoordinatesDeep(feature.geometry.coordinates, ([lng, lat]) => ([
        centerLng + (lng - centerLng) * scale,
        centerLat + (lat - centerLat) * scale,
      ])),
    },
  };
};

const scrollToElementWithOffset = (element, offset = NAVBAR_SCROLL_OFFSET, behavior = 'smooth') => {
  if (!element) return;
  const elementTop = element.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: Math.max(elementTop - offset, 0),
    behavior,
  });
};

const getBaseDepartmentCounts = () => {
  const departmentNames = new Set(Object.keys(getRuntimeDivipolaByDepartment()));
  Object.values(runtimeDepartmentNameByCode).forEach((departmentName) => {
    if (departmentName) departmentNames.add(departmentName);
  });

  const baseCounts = Array.from(departmentNames).reduce((acc, deptName) => {
    acc[normalizeDepartmentName(deptName)] = 0;
    return acc;
  }, {});

  return baseCounts;
};

const formatMetricValue = (value = 0) => {
  const numericValue = Number(value) || 0;
  return METRIC_FORMATTER.format(Math.round(numericValue));
};

const sumNumericValues = (values = []) => values.reduce((sum, value) => sum + (Number(value) || 0), 0);

const formatDataCellValue = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  return typeof value === 'number' ? formatMetricValue(value) : value;
};

const buildSearchIndexValue = (values = []) => normalizeDepartmentName(
  values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(' ')
);

const countDistinctValues = (items = [], selector = (item) => item) => {
  const uniqueValues = new Set();

  items.forEach((item) => {
    const value = selector(item);

    if (value === undefined || value === null || value === '') return;
    uniqueValues.add(String(value).trim());
  });

  return uniqueValues.size;
};

const compareTechnicalValues = (leftValue, rightValue, direction = 'desc') => {
  const leftNumber = typeof leftValue === 'number' ? leftValue : Number.NaN;
  const rightNumber = typeof rightValue === 'number' ? rightValue : Number.NaN;
  const multiplier = direction === 'asc' ? 1 : -1;

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return (leftNumber - rightNumber) * multiplier;
  }

  const normalizedLeft = String(leftValue ?? '').toLocaleLowerCase('es-CO');
  const normalizedRight = String(rightValue ?? '').toLocaleLowerCase('es-CO');
  return normalizedLeft.localeCompare(normalizedRight, 'es-CO') * multiplier;
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getRecordFieldValue = (recordOrFields, fieldNames = []) => {
  const fields = recordOrFields?.fields || recordOrFields || {};

  for (const fieldName of fieldNames) {
    const value = fields?.[fieldName];

    if (Array.isArray(value)) {
      const firstValue = value.find(
        (item) => item !== undefined && item !== null && String(item).trim() !== ''
      );
      if (firstValue !== undefined) return firstValue;
      continue;
    }

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
};

const toNumericValue = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const normalized = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(normalized) ? normalized : 0;
};

const normalizeBooleanishField = (value) => {
  if (value === undefined || value === null || value === '') return '';

  const normalized = String(value)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['SI', 'TRUE', 'YES'].includes(normalized)) return 'Sí';
  if (['NO', 'FALSE'].includes(normalized)) return 'No';
  return String(value).trim();
};

const normalizeSchoolStatus = (value) => {
  if (value === undefined || value === null || value === '') return '';

  const normalized = String(value)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('EN PAUSA')) return 'En pausa';
  if (normalized.includes('INACT')) return 'Inactiva';
  if (normalized.includes('ACTIV')) return 'Activa';
  return String(value).trim();
};

const getSchoolField = (record, fieldKey) => {
  return getRecordFieldValue(record, SCHOOL_FIELD_MAP[fieldKey] || []);
};

const getMarketField = (record, fieldKey) => {
  return getRecordFieldValue(record, MARKET_FIELD_MAP[fieldKey] || []);
};

const extractNumericAverage = (value) => {
  if (value === undefined || value === null || value === '') return 0;

  const matches = String(value).match(/\d+(?:[.,]\d+)?/g) || [];

  if (matches.length === 0) return 0;

  const values = matches
    .map((item) => Number(String(item).replace(',', '.')))
    .filter((item) => Number.isFinite(item));

  if (values.length === 0) return 0;

  return values.reduce((sum, item) => sum + item, 0) / values.length;
};

const resolveDepartmentNameFromCodeOrLabel = (departmentCode = '', departmentLabel = '') => {
  const normalizedCode = normalizeDepartmentCode(departmentCode);
  if (normalizedCode) {
    const mappedName = getDepartmentNameByCode(normalizedCode);
    if (mappedName) return mappedName;
  }

  return departmentLabel;
};

const resolveDepartmentNameFromRecord = (record, fallbackDepartment = '') => {
  const departmentCode = normalizeDepartmentCode(
    record?.fields?.departmentCode
    || record?.fields?.DepartmentCode
    || record?.fields?.dpto_ccdgo
  );

  return resolveDepartmentNameFromCodeOrLabel(departmentCode, fallbackDepartment);
};

const buildFestivalCounts = (records = []) => {
  return records.reduce((acc, rec) => {
    const deptRaw = rec?.fields?.dpt ?? rec?.fields?.dpto ?? rec?.fields?.departamento ?? rec?.fields?.department;
    const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
    const resolvedDepartmentName = resolveDepartmentNameFromRecord(rec, deptName);
    const normalized = normalizeDepartmentName(resolvedDepartmentName);

    if (!normalized || normalized === 'DESCONOCIDO') return acc;

    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
};

const isSchoolRecordVisible = (record) => {
  const departmentName = resolveDepartmentNameFromCodeOrLabel(
    getSchoolField(record, 'departmentCode'),
    getSchoolField(record, 'department')
  );
  const department = normalizeDepartmentName(departmentName);
  const name = getSchoolField(record, 'name');
  const status = normalizeSchoolStatus(getSchoolField(record, 'status'));

  if (!department || department === 'DESCONOCIDO') return false;
  if (!name) return false;
  return status !== 'Inactiva';
};

const buildPublicSchoolRecord = (record) => {
  if (!isSchoolRecordVisible(record)) return null;

  const departmentCode = normalizeDepartmentCode(getSchoolField(record, 'departmentCode'));
  const municipalityCode = normalizeMunicipalityCode(
    getSchoolField(record, 'municipalityCode') || getSchoolField(record, 'divipola')
  );
  const departmentName = resolveDepartmentNameFromCodeOrLabel(
    departmentCode,
    getSchoolField(record, 'department')
  );

  return {
    id: record?.id || getSchoolField(record, 'id'),
    status: normalizeSchoolStatus(getSchoolField(record, 'status')),
    departmentCode,
    municipalityCode,
    department: normalizeDepartmentName(departmentName),
    municipality: getSchoolField(record, 'municipality'),
    divipola: municipalityCode || getSchoolField(record, 'divipola'),
    name: getSchoolField(record, 'name'),
    schoolType: getSchoolField(record, 'schoolType'),
    category: getSchoolField(record, 'category'),
    legalCreation: normalizeBooleanishField(getSchoolField(record, 'legalCreation')),
    legalPersonhood: normalizeBooleanishField(getSchoolField(record, 'legalPersonhood')),
    nature: getSchoolField(record, 'nature'),
    dependsOnEntity: normalizeBooleanishField(getSchoolField(record, 'dependsOnEntity')),
    parentEntity: getSchoolField(record, 'parentEntity'),
    workSite: getSchoolField(record, 'workSite'),
    hasInternet: normalizeBooleanishField(getSchoolField(record, 'internetAccess')),
    instruments: toNumericValue(getSchoolField(record, 'instruments')),
    teachers: toNumericValue(getSchoolField(record, 'teachers')),
    students: toNumericValue(getSchoolField(record, 'students')),
    groups: toNumericValue(getSchoolField(record, 'groups')),
    practices: getSchoolField(record, 'practices'),
    workshops: normalizeBooleanishField(getSchoolField(record, 'workshops')),
    communityOrganization: normalizeBooleanishField(getSchoolField(record, 'communityOrganization')),
  };
};

const buildMarketName = (record) => {
  return getMarketField(record, 'name')
    || record?.fields?.Market_Name
    || record?.fields?.name
    || record?.fields?.nombre
    || 'Mercado sin nombre';
};

const isMarketRecordVisible = (record) => {
  const departmentName = resolveDepartmentNameFromCodeOrLabel(
    getMarketField(record, 'departmentCode'),
    getMarketField(record, 'department')
  );
  const department = normalizeDepartmentName(departmentName);
  const name = buildMarketName(record);

  return Boolean(department && department !== 'DESCONOCIDO' && name);
};

const buildPublicMarketRecord = (record) => {
  if (!isMarketRecordVisible(record)) return null;

  const departmentCode = normalizeDepartmentCode(getMarketField(record, 'departmentCode'));
  const municipalityCode = normalizeMunicipalityCode(getMarketField(record, 'municipalityCode'));
  const departmentName = resolveDepartmentNameFromCodeOrLabel(
    departmentCode,
    getMarketField(record, 'department')
  );

  return {
    id: record?.id || '',
    name: buildMarketName(record),
    departmentCode,
    municipalityCode,
    department: normalizeDepartmentName(departmentName),
    municipality: getMarketField(record, 'municipality'),
    createdYear: getMarketField(record, 'createdYear'),
    versions: getMarketField(record, 'versions'),
    periodicity: getMarketField(record, 'periodicity'),
    editionDate2026: getMarketField(record, 'editionDate2026'),
    responsibleEntity: getMarketField(record, 'responsibleEntity'),
    organizationType: getMarketField(record, 'organizationType'),
    legalFormalStatus: normalizeBooleanishField(getMarketField(record, 'legalFormalStatus')),
    linkedFestival: normalizeBooleanishField(getMarketField(record, 'linkedFestival')),
    festivalName: getMarketField(record, 'festivalName'),
    festivalVersions: getMarketField(record, 'festivalVersions'),
    festivalDates: getMarketField(record, 'festivalDates'),
    fundingSources: getMarketField(record, 'fundingSources'),
    publicBudgetShare: getMarketField(record, 'publicBudgetShare'),
    curationModel: getMarketField(record, 'curationModel'),
    openCall: normalizeBooleanishField(getMarketField(record, 'openCall')),
    averageProjects: extractNumericAverage(getMarketField(record, 'averageProjects')),
    averageProjectsLabel: getMarketField(record, 'averageProjects'),
    averageBuyers: extractNumericAverage(getMarketField(record, 'averageBuyers')),
    averageBuyersLabel: getMarketField(record, 'averageBuyers'),
    buyerSpaces: getMarketField(record, 'buyerSpaces'),
    buyerStrategies: getMarketField(record, 'buyerStrategies'),
    preAgreements: getMarketField(record, 'preAgreements'),
    circulationMechanisms: getMarketField(record, 'circulationMechanisms'),
    publicArticulations: getMarketField(record, 'publicArticulations'),
    partnerNetworks: getMarketField(record, 'partnerNetworks'),
    pnmcConnections: getMarketField(record, 'pnmcConnections'),
    pnmcConnectionsDetail: getMarketField(record, 'pnmcConnectionsDetail'),
    collaborationPotential: getMarketField(record, 'collaborationPotential'),
    territorialImpact: getMarketField(record, 'territorialImpact'),
  };
};

const buildSchoolCounts = (records = []) => {
  return records.reduce((acc, record) => {
    const normalized = normalizeDepartmentName(record?.department);

    if (!normalized || normalized === 'DESCONOCIDO') return acc;

    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
};

const buildMarketCounts = (records = []) => {
  return records.reduce((acc, record) => {
    const normalized = normalizeDepartmentName(record?.department);

    if (!normalized || normalized === 'DESCONOCIDO') return acc;

    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
};

const buildLayerAnalytics = (counts = {}, records = [], selectedDept = 'Nacional') => {
  const allDepartmentNames = new Set([
    ...Object.keys(getRuntimeDivipolaByDepartment()),
    ...Object.values(runtimeDepartmentNameByCode),
  ]);

  const entries = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalRecords = records.length || entries.reduce((acc, item) => acc + item.count, 0);
  const activeDepartments = entries.length;
  const totalDepartments = allDepartmentNames.size;
  const selectedNormalized = normalizeDepartmentName(selectedDept);
  const selectedCount = selectedDept === 'Nacional' ? totalRecords : (counts[selectedNormalized] || 0);
  const selectedRank = selectedDept === 'Nacional' ? null : entries.findIndex((item) => item.name === selectedNormalized) + 1;
  const coverage = totalDepartments > 0 ? Math.round((activeDepartments / totalDepartments) * 100) : 0;
  const concentration = totalRecords > 0 && entries.length > 0 ? Math.round((entries[0].count / totalRecords) * 100) : 0;

  return {
    entries,
    topDepartments: entries.slice(0, 6),
    uncoveredDepartments: Array.from(allDepartmentNames)
      .map((name) => normalizeDepartmentName(name))
      .filter((name) => !entries.some((item) => item.name === name))
      .slice(0, 8),
    totalRecords,
    activeDepartments,
    totalDepartments,
    coverage,
    concentration,
    selectedCount,
    selectedRank,
  };
};

const buildSchoolCapacityTotals = (records = []) => {
  return records.reduce((acc, record) => {
    acc.totalStudents += record.students || 0;
    acc.totalTeachers += record.teachers || 0;
    acc.totalInstruments += record.instruments || 0;
    acc.totalGroups += record.groups || 0;

    if (record.hasInternet === 'Sí') acc.withInternet += 1;
    if (record.communityOrganization === 'Sí') acc.withCommunityOrganization += 1;
    if (record.status === 'Activa') acc.active += 1;
    if (record.status === 'En pausa') acc.paused += 1;

    return acc;
  }, {
    totalStudents: 0,
    totalTeachers: 0,
    totalInstruments: 0,
    totalGroups: 0,
    withInternet: 0,
    withCommunityOrganization: 0,
    active: 0,
    paused: 0,
  });
};

const buildMarketTotals = (records = []) => {
  const totals = records.reduce((acc, record) => {
    acc.totalProjects += record.averageProjects || 0;
    acc.totalBuyers += record.averageBuyers || 0;
    if (record.openCall === 'Sí') acc.openCalls += 1;
    if (record.linkedFestival === 'Sí') acc.linkedToFestival += 1;
    return acc;
  }, {
    totalProjects: 0,
    totalBuyers: 0,
    openCalls: 0,
    linkedToFestival: 0,
  });

  return {
    ...totals,
    totalMarkets: records.length,
    averageProjectsPerMarket: records.length > 0 ? totals.totalProjects / records.length : 0,
    averageBuyersPerMarket: records.length > 0 ? totals.totalBuyers / records.length : 0,
  };
};

const buildDepartmentSummaryMap = (baseCounts = {}, festivalRecordsByDepartment = {}, schoolRecordsByDepartment = {}, marketRecordsByDepartment = {}) => {
  const summaryMap = Object.keys(baseCounts).reduce((acc, departmentName) => {
    acc[departmentName] = { ...EMPTY_DEPARTMENT_SUMMARY };
    return acc;
  }, {});

  Object.entries(festivalRecordsByDepartment).forEach(([departmentName, records]) => {
    if (!summaryMap[departmentName]) {
      summaryMap[departmentName] = { ...EMPTY_DEPARTMENT_SUMMARY };
    }

    summaryMap[departmentName].festivalCount = records.length;
  });

  Object.entries(schoolRecordsByDepartment).forEach(([departmentName, records]) => {
    if (!summaryMap[departmentName]) {
      summaryMap[departmentName] = { ...EMPTY_DEPARTMENT_SUMMARY };
    }

    const totals = buildSchoolCapacityTotals(records);
    summaryMap[departmentName].schoolCount = records.length;
    summaryMap[departmentName].totalStudents = totals.totalStudents;
    summaryMap[departmentName].totalTeachers = totals.totalTeachers;
    summaryMap[departmentName].totalInstruments = totals.totalInstruments;
    summaryMap[departmentName].totalGroups = totals.totalGroups;
  });

  Object.entries(marketRecordsByDepartment).forEach(([departmentName, records]) => {
    if (!summaryMap[departmentName]) {
      summaryMap[departmentName] = { ...EMPTY_DEPARTMENT_SUMMARY };
    }

    const totals = buildMarketTotals(records);
    summaryMap[departmentName].marketCount = records.length;
    summaryMap[departmentName].totalMarketProjects = totals.totalProjects;
    summaryMap[departmentName].totalMarketBuyers = totals.totalBuyers;
  });

  Object.values(summaryMap).forEach((summary) => {
    summary.totalRecords = summary.festivalCount + summary.schoolCount + summary.marketCount;
  });

  return summaryMap;
};

const getFestivalRecordName = (record) => {
  return record?.fields?.Festival_Name
    || record?.fields?.name
    || record?.fields?.nombre
    || record?.fields?.title
    || record?.fields?.festival
    || record?.fields?.t
    || 'Registro sin nombre';
};

const buildDepartmentPopupMarkup = ({
  deptName,
  activeCategory,
  stats = EMPTY_DEPARTMENT_SUMMARY,
  embedded = false,
}) => {
  const isGeneralPopup = activeCategory === 'General';
  const isSchoolsPopup = activeCategory === 'Escuelas de Música';
  const isFestivalsPopup = activeCategory === 'Festivales';
  const isMarketsPopup = activeCategory === 'Mercados Musicales';
  const popupHeadline = activeCategory === 'General'
    ? {
      value: formatMetricValue(stats.totalRecords),
    }
    : isSchoolsPopup
      ? {
        value: formatMetricValue(stats.schoolCount),
      }
      : isFestivalsPopup
        ? {
        value: formatMetricValue(stats.festivalCount),
      }
        : isMarketsPopup
          ? {
            value: formatMetricValue(stats.marketCount),
          }
        : {
          value: 'Próx.',
        };
  const generalDistributionCards = [
    {
      label: 'Festivales',
      value: stats.festivalCount,
      accent: '#00DA5E',
    },
    {
      label: 'Escuelas',
      value: stats.schoolCount,
      accent: '#8BF784',
    },
    {
      label: 'Mercados',
      value: stats.marketCount,
      accent: '#291242',
    },
  ];
  const festivalsShare = stats.totalRecords > 0 ? Math.round((stats.festivalCount / stats.totalRecords) * 100) : 0;
  const schoolsShare = stats.totalRecords > 0 ? Math.round((stats.schoolCount / stats.totalRecords) * 100) : 0;
  const marketsShare = stats.totalRecords > 0 ? Math.round((stats.marketCount / stats.totalRecords) * 100) : 0;
  const wrapperClasses = embedded
    ? 'w-full h-full'
    : 'p-2 min-w-[280px] max-w-[300px]';
  const shellClasses = embedded
    ? 'overflow-hidden bg-transparent h-full flex flex-col'
    : 'overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.12)]';

  return `
    <div class="${wrapperClasses}">
      <div class="${shellClasses}">
        <div class="bg-[#291242] px-4 py-4">
          <div class="flex items-stretch justify-between gap-4 min-h-[76px]">
            <div class="min-w-0 flex items-end">
              <div class="text-[0.98rem] font-bold uppercase tracking-[0.1em] leading-tight text-white">
                ${escapeHtml(deptName)}
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end justify-center text-right">
              <div class="text-[0.95rem] font-bold leading-none text-white">${popupHeadline.value}</div>
              <div class="mt-1 text-[0.46rem] font-bold uppercase tracking-[0.18em] text-slate-300">Registros</div>
            </div>
          </div>
        </div>
        ${isGeneralPopup ? `
        <div class="px-4 py-4 bg-white flex-1">
          <div class="rounded-[1.2rem] border border-slate-100 bg-slate-50 overflow-hidden">
            <div class="flex h-1.5 overflow-hidden bg-white">
              <span style="width:${festivalsShare}%;background:#00DA5E;"></span>
              <span style="width:${schoolsShare}%;background:#8BF784;"></span>
              <span style="width:${marketsShare}%;background:#291242;"></span>
            </div>
            <div class="grid grid-cols-3 divide-x divide-slate-200 items-stretch">
              ${generalDistributionCards.map((item) => {
                const share = stats.totalRecords > 0 ? Math.round((item.value / stats.totalRecords) * 100) : 0;

                return `
              <div class="px-3.5 py-3.5">
                <div class="flex items-center gap-2 text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span class="h-2 w-2 rounded-full flex-shrink-0" style="background:${item.accent};"></span>
                  ${item.label}
                </div>
                <div class="mt-3 text-[1.2rem] font-bold leading-none text-[#291242]">${formatMetricValue(item.value)}</div>
                <div class="mt-2 text-[0.42rem] font-bold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">${share}% del registro</div>
              </div>
          `;
              }).join('')}
            </div>
          </div>
        </div>
        ` : isSchoolsPopup && embedded ? `
        <div class="px-4 py-4 bg-white flex-1">
          <div class="grid grid-cols-3 gap-3 h-full">
            ${[
              { label: 'Escuelas', value: stats.schoolCount },
              { label: 'Estudiantes', value: stats.totalStudents },
              { label: 'Docentes', value: stats.totalTeachers },
            ].map((item) => `
              <div class="rounded-[1.1rem] border border-slate-100 bg-slate-50 px-3 py-3 flex flex-col justify-between">
                <div class="text-[0.45rem] font-bold uppercase tracking-[0.14em] text-slate-400">${item.label}</div>
                <div class="mt-3 text-[1.05rem] font-bold leading-none text-[#291242]">${formatMetricValue(item.value)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : isFestivalsPopup && embedded ? `
        <div class="px-4 py-4 bg-white flex-1">
          <div class="rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-4 h-full flex items-center justify-between gap-4">
            <div>
              <div class="text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-400">Festivales</div>
              <div class="mt-3 text-[1.35rem] font-bold leading-none text-[#291242]">${formatMetricValue(stats.festivalCount)}</div>
            </div>
            <div class="h-10 w-px bg-slate-200"></div>
            <div class="text-right">
              <div class="text-[0.48rem] font-bold uppercase tracking-[0.16em] text-slate-400">Lectura</div>
              <div class="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#291242]">Circulación visible</div>
            </div>
          </div>
        </div>
        ` : isMarketsPopup && embedded ? `
        <div class="px-4 py-4 bg-white flex-1">
          <div class="grid grid-cols-3 gap-3 h-full">
            ${[
              { label: 'Mercados', value: stats.marketCount },
              { label: 'Proyectos', value: stats.totalMarketProjects },
              { label: 'Bookers', value: stats.totalMarketBuyers },
            ].map((item) => `
              <div class="rounded-[1.1rem] border border-slate-100 bg-slate-50 px-3 py-3 flex flex-col justify-between">
                <div class="text-[0.45rem] font-bold uppercase tracking-[0.14em] text-slate-400">${item.label}</div>
                <div class="mt-3 text-[1.05rem] font-bold leading-none text-[#291242]">${formatMetricValue(item.value)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
};

const DEPARTMENT_HIT_AREA_STYLE = {
  fill: true,
  fillColor: '#000000',
  fillOpacity: 0,
  color: 'transparent',
  opacity: 0,
  weight: 2,
  interactive: true,
};

const getChoroplethStyles = (count, isSelected = true, layerKey = 'Festivales') => {
  let fillColor = '#291242';
  let fillOpacity = 0.18;
  let strokeColor = 'rgba(255,255,255,0.18)';
  let strokeWeight = 1.1;
  const layerSteps = MAP_LAYER_CHOROPLETH_STEPS[layerKey] || MAP_LAYER_CHOROPLETH_STEPS.Festivales;
  const activeStep = layerSteps.find((step) => count >= step.min && count <= step.max);

  if (activeStep) {
    fillColor = activeStep.color;
    fillOpacity = activeStep.opacity;
  }

  if (!isSelected) {
    fillColor = '#291242';
    fillOpacity = 0.12;
    strokeColor = 'rgba(255,255,255,0.08)';
  }

  if (isSelected && count > 0) {
    strokeColor = 'rgba(255,255,255,0.38)';
    strokeWeight = 1.5;
  }

  return {
    fillColor,
    fill: true,
    fillOpacity,
    fillRule: 'nonzero',
    color: strokeColor,
    interactive: true,
    weight: strokeWeight,
    opacity: 1,
  };
};

export {
  FESTIVAL_COUNTS_CACHE_KEY,
  SCHOOL_COUNTS_CACHE_KEY,
  MARKET_COUNTS_CACHE_KEY,
  ARCHIPELAGO_NORMALIZED_NAME,
  METRIC_FORMATTER,
  MAP_LAYER_CHOROPLETH_STEPS,
  EMPTY_DEPARTMENT_SUMMARY,
  SCHOOL_PUBLICATION_POLICY,
  MARKET_PUBLICATION_POLICY,
  DEPARTMENT_HIT_AREA_STYLE,
  getRuntimeDivipolaByDepartment,
  setRuntimeDivipolaByDepartment,
  normalizeDepartmentCode,
  normalizeMunicipalityCode,
  setRuntimeDepartmentCatalog,
  getDepartmentNameByCode,
  getSortedDepartmentNames,
  normalizeDepartmentName,
  normalizeMunicipalityName,
  sortUniqueByLocale,
  getDepartmentDisplayName,
  getDepartmentSelectionValue,
  resolveDepartmentDivipolaKey,
  municipalityExistsInList,
  getFeatureDepartmentName,
  getFeatureDepartmentCode,
  getFeatureDepartmentNormalizedName,
  buildScaledFeature,
  scrollToElementWithOffset,
  getBaseDepartmentCounts,
  formatMetricValue,
  sumNumericValues,
  formatDataCellValue,
  buildSearchIndexValue,
  countDistinctValues,
  compareTechnicalValues,
  resolveDepartmentNameFromRecord,
  buildFestivalCounts,
  buildPublicSchoolRecord,
  buildPublicMarketRecord,
  buildSchoolCounts,
  buildMarketCounts,
  buildLayerAnalytics,
  buildSchoolCapacityTotals,
  buildMarketTotals,
  buildDepartmentSummaryMap,
  getFestivalRecordName,
  buildDepartmentPopupMarkup,
  getChoroplethStyles,
};
