import {
  Building2,
  CalendarDays,
  Globe,
  MapPin,
  UserCircle2,
  Users2,
} from 'lucide-react';
import {
  getRuntimeDivipolaByDepartment,
  resolveDepartmentDivipolaKey,
  sortUniqueByLocale,
} from '../../map/domain/mapDomain.js';

const MAP_PARTICIPATION_DRAFT_STORAGE_KEY = 'pnmc-map-participation-draft-v1';
const MAP_PARTICIPATION_QUEUE_STORAGE_KEY = 'pnmc-map-participation-queue-v1';

const MAP_PARTICIPATION_ACTOR_OPTIONS = [
  {
    key: 'individual',
    label: 'Registro individual',
    shortLabel: 'Individual',
    description: 'Músicos, gestores, formadores, investigadores, productores y otros agentes que participen a título personal en el ecosistema musical.',
    icon: UserCircle2,
  },
  {
    key: 'collective',
    label: 'Agrupación o colectivo',
    shortLabel: 'Colectivo',
    description: 'Bandas, ensambles, colectivos creativos y procesos autogestionados con práctica musical activa.',
    icon: Users2,
  },
  {
    key: 'organization',
    label: 'Organización',
    shortLabel: 'Entidad',
    description: 'Fundaciones, corporaciones, redes, asociaciones o iniciativas con trabajo sostenido en el ecosistema musical.',
    icon: Building2,
  },
  {
    key: 'festival',
    label: 'Festival',
    shortLabel: 'Festival',
    description: 'Festivales, circuitos, encuentros o celebraciones que activen programación y circulación musical.',
    icon: CalendarDays,
  },
  {
    key: 'market',
    label: 'Mercado',
    shortLabel: 'Mercado',
    description: 'Plataformas de conexión profesional, ruedas de negocios, vitrinas y nodos de circulación.',
    icon: Globe,
  },
  {
    key: 'space',
    label: 'Sala o espacio',
    shortLabel: 'Espacio',
    description: 'Teatros, casas culturales, estudios, salas o infraestructuras donde ocurren prácticas y encuentros musicales.',
    icon: MapPin,
  },
];

const MAP_PARTICIPATION_ROLE_OPTIONS = {
  default: [
    'Creación',
    'Formación',
    'Producción',
    'Circulación',
    'Investigación',
    'Mediación',
    'Preservación',
    'Gobernanza',
    'Comercialización',
  ],
  individual: [
    'Interpretación',
    'Composición o creación',
    'Gestión cultural',
    'Producción',
    'Formación',
    'Investigación',
    'Circulación',
    'Mediación',
    'Comunicación',
    'Técnica de sonido',
    'Lutería',
    'Programación',
    'Preservación',
    'Emprendimiento',
    'Otra',
  ],
};

const MAP_PARTICIPATION_SCOPE_OPTIONS = [
  'Comunitario',
  'Municipal',
  'Departamental',
  'Regional',
  'Nacional',
  'Internacional',
];
const MAP_PARTICIPATION_MARKET_FREQUENCY_OPTIONS = [
  'Anual',
  'Bienal',
  'Semestral',
  'Trimestral',
  'Otra',
];
const MAP_PARTICIPATION_FESTIVAL_SETTING_OPTIONS = [
  'Principalmente urbano',
  'Principalmente rural',
  'Mixto',
];
const MAP_PARTICIPATION_FESTIVAL_VENUE_OPTIONS = [
  'Una sola ciudad o municipio',
  'Varias ciudades o municipios',
];
const MAP_PARTICIPATION_FESTIVAL_ACCESS_OPTIONS = [
  'Entrada gratuita en toda la programación',
  'Pago en toda la programación',
  'Algunas actividades gratuitas y otras de pago',
];
const MAP_PARTICIPATION_MONTH_OPTIONS = [
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
const MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS = [
  'Ya se realizó',
  'Se va a realizar',
  'Está por confirmar',
];

const MAP_PARTICIPATION_LEGAL_OPTIONS = ['Sí', 'No', 'En trámite'];
const MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS = [
  'Cédula de ciudadanía',
  'Tarjeta de identidad',
  'Cédula de extranjería',
  'Pasaporte',
  'Permiso por protección temporal',
  'Otro',
];

const MAP_PARTICIPATION_IDENTITY_COPY = {
  individual: {
    actorNameLabel: 'Nombre completo',
    actorNamePlaceholder: 'Escribe el nombre completo',
    actorNameError: 'Escribe los nombres y apellidos del registro individual.',
    firstNameLabel: 'Nombres',
    lastNameLabel: 'Apellidos',
    responsibleEntityLabel: '',
    responsibleEntityPlaceholder: '',
    showResponsibleEntity: false,
    contactNameLabel: '',
    contactRoleLabel: '',
    showContactFields: false,
    showIdentificationFields: true,
    showTerritoryScope: false,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
    identificationTypeLabel: 'Tipo de identificación',
    identificationNumberLabel: 'Número de identificación',
  },
  collective: {
    actorNameLabel: 'Nombre de la agrupación o colectivo',
    actorNamePlaceholder: 'Escribe el nombre de la agrupación o colectivo',
    actorNameError: 'Escribe el nombre de la agrupación o colectivo.',
    responsibleEntityLabel: 'Nombre jurídico o razón social (si aplica)',
    responsibleEntityPlaceholder: 'Escribe el nombre jurídico si existe',
    showResponsibleEntity: true,
    contactNameLabel: 'Persona de contacto de la agrupación o colectivo',
    contactRoleLabel: 'Rol dentro de la agrupación o colectivo',
    showContactFields: true,
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
  },
  organization: {
    actorNameLabel: 'Nombre de la organización',
    actorNamePlaceholder: 'Escribe el nombre de la organización',
    actorNameError: 'Escribe el nombre de la organización.',
    responsibleEntityLabel: 'Razón social o nombre jurídico',
    responsibleEntityPlaceholder: 'Escribe la razón social o nombre jurídico',
    showResponsibleEntity: true,
    contactNameLabel: 'Persona de contacto de la organización',
    contactRoleLabel: 'Cargo o rol de contacto',
    showContactFields: true,
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
  },
  festival: {
    actorNameLabel: 'Nombre del festival',
    actorNamePlaceholder: 'Escribe el nombre del festival',
    actorNameError: 'Escribe el nombre del festival.',
    responsibleEntityLabel: 'Entidad u organización responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad u organización responsable',
    showResponsibleEntity: true,
    contactNameLabel: 'Persona de contacto del festival',
    contactRoleLabel: 'Rol dentro del festival',
    showContactFields: true,
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
  },
  market: {
    actorNameLabel: 'Nombre del mercado musical',
    actorNamePlaceholder: 'Escribe el nombre del mercado musical',
    actorNameError: 'Escribe el nombre del mercado musical.',
    responsibleEntityLabel: 'Entidad u organización responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad u organización responsable',
    showResponsibleEntity: true,
    contactNameLabel: 'Persona de contacto del mercado',
    contactRoleLabel: 'Rol dentro del mercado',
    showContactFields: true,
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
    showRoleSection: false,
  },
  space: {
    actorNameLabel: 'Nombre de la sala o espacio',
    actorNamePlaceholder: 'Escribe el nombre de la sala o espacio',
    actorNameError: 'Escribe el nombre de la sala o espacio.',
    responsibleEntityLabel: 'Entidad, proceso o administración responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad o administración responsable',
    showResponsibleEntity: true,
    contactNameLabel: 'Persona de contacto de la sala o espacio',
    contactRoleLabel: 'Rol dentro de la sala o espacio',
    showContactFields: true,
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    websiteLabel: 'Sitio web (opcional)',
    showSocialFields: true,
  },
};

const MAP_PARTICIPATION_FIELDSETS = {
  organization: [
    { key: 'organizationSubtype', label: 'Tipo de organización', type: 'select', options: ['Fundación', 'Corporación', 'Asociación', 'Colectivo', 'Entidad pública', 'Emprendimiento cultural', 'Otra'] },
    { key: 'yearFounded', label: 'Año de creación', type: 'number', min: 1900, max: 2100 },
    { key: 'legalStatus', label: 'Constitución legal', type: 'select', options: MAP_PARTICIPATION_LEGAL_OPTIONS },
    { key: 'mainPrograms', label: 'Líneas o programas principales', type: 'textarea', rows: 4 },
  ],
  festival: [
    { key: 'festivalDurationDays', label: '¿Cuántos días dura el festival?', type: 'number', min: 1 },
    { key: 'festivalSetting', label: '¿Dónde se desarrolla principalmente el festival?', type: 'select', options: MAP_PARTICIPATION_FESTIVAL_SETTING_OPTIONS },
    { key: 'festivalVenueMode', label: '¿Se realiza en una sola ciudad o municipio, o en varios?', type: 'select', options: MAP_PARTICIPATION_FESTIVAL_VENUE_OPTIONS },
    { key: 'festivalFrequency', label: 'Periodicidad', type: 'select', options: MAP_PARTICIPATION_MARKET_FREQUENCY_OPTIONS },
    { key: 'festivalVersions', label: '¿Cuántas versiones o ediciones lleva a la fecha?', type: 'number', min: 0 },
    { key: 'festivalTicketing', label: 'Tipo de acceso al público', type: 'select', options: MAP_PARTICIPATION_FESTIVAL_ACCESS_OPTIONS },
    { key: 'openCall', label: '¿Normalmente hacen convocatoria abierta para participar dentro del festival?', type: 'select', options: ['Sí', 'No'] },
    { key: 'festivalThisYearStatus', label: '¿Este año ya se realizó o se va a realizar?', type: 'select', options: MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS },
  ],
  market: [
    { key: 'marketFrequency', label: 'Periodicidad', type: 'select', options: MAP_PARTICIPATION_MARKET_FREQUENCY_OPTIONS },
    { key: 'marketEditionsCount', label: 'Número de ediciones realizadas', type: 'number', min: 0 },
    { key: 'averageBuyers', label: 'Promedio de bookers o compradores por edición', type: 'number', min: 0 },
    { key: 'linkedFestival', label: '¿Se hace en el marco o de manera articulada con algún festival?', type: 'select', options: ['Sí', 'No'] },
    { key: 'marketThisYearStatus', label: '¿Este año ya se realizó o se va a realizar?', type: 'select', options: MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS },
  ],
  individual: [
    { key: 'individualProfile', label: 'Perfil principal', type: 'select', options: ['Músico o intérprete', 'Compositor o creador', 'Gestor o productor', 'Docente o formador', 'Investigador', 'Técnico o luthier', 'Comunicador cultural', 'Otro'] },
    { key: 'trajectoryYears', label: 'Años de trayectoria', type: 'number', min: 0 },
    { key: 'linkedProcesses', label: 'Procesos, redes, agrupaciones u organizaciones con las que se articula', type: 'textarea', rows: 4 },
  ],
  collective: [
    { key: 'members', label: 'Número de integrantes', type: 'number', min: 0 },
    { key: 'musicalPractice', label: 'Práctica o género principal', type: 'text' },
    { key: 'circulationScope', label: 'Alcance de circulación', type: 'select', options: MAP_PARTICIPATION_SCOPE_OPTIONS },
    { key: 'collectiveTrajectory', label: 'Trayectoria o hitos recientes', type: 'textarea', rows: 4 },
  ],
  space: [
    { key: 'spaceType', label: 'Tipo de espacio', type: 'select', options: ['Teatro', 'Casa cultural', 'Centro comunitario', 'Sala de conciertos', 'Estudio', 'Espacio alternativo'] },
    { key: 'spaceCapacity', label: 'Capacidad aproximada', type: 'number', min: 0 },
    { key: 'spaceUses', label: 'Usos principales del espacio', type: 'textarea', rows: 4 },
    { key: 'technicalEquipment', label: 'Dotación o equipamiento disponible', type: 'textarea', rows: 4 },
  ],
};

const hasMapParticipationValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value;
  return String(value ?? '').trim() !== '';
};

const getMapParticipationFieldErrorMessage = (field) => {
  if (field?.type === 'select') return 'Selecciona una opción.';
  if (field?.type === 'date') return 'Selecciona una fecha.';
  return 'Completa este campo.';
};

const createMapParticipationFormState = () => ({
  actorType: 'individual',
  actorName: '',
  individualFirstName: '',
  individualLastName: '',
  identificationType: '',
  identificationNumber: '',
  hasArtisticName: false,
  responsibleEntity: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  department: '',
  municipality: '',
  territoryScope: '',
  website: '',
  facebookUrl: '',
  instagramUrl: '',
  roles: [],
  musicalFields: '',
  description: '',
  contribution: '',
  needs: '',
  organizationSubtype: '',
  yearFounded: '',
  legalStatus: '',
  mainPrograms: '',
  festivalDurationDays: '',
  festivalSetting: '',
  festivalVenueMode: 'Una sola ciudad o municipio',
  festivalAdditionalLocations: [],
  festivalFrequency: '',
  festivalVersions: '',
  festivalMonth: '',
  festivalHabitualMonths: [],
  festivalTicketing: '',
  openCall: '',
  festivalThisYearStatus: '',
  festivalThisYearDate: '',
  festivalThisYearStartDate: '',
  festivalThisYearEndDate: '',
  festivalCurrentOpenCall: '',
  festivalOpenCallDeadline: '',
  marketFrequency: '',
  marketEditionsCount: '',
  averageBuyers: '',
  linkedFestival: '',
  linkedFestivalName: '',
  marketHabitualMonths: [],
  marketThisYearStatus: '',
  marketThisYearMonth: '',
  marketThisYearDate: '',
  individualProfile: '',
  artisticName: '',
  trajectoryYears: '',
  linkedProcesses: '',
  members: '',
  musicalPractice: '',
  circulationScope: '',
  collectiveTrajectory: '',
  spaceType: '',
  spaceCapacity: '',
  spaceUses: '',
  technicalEquipment: '',
  consent: false,
});

const getMapParticipationMunicipalities = (department = '') => {
  const grouped = getRuntimeDivipolaByDepartment();
  const departmentKey = resolveDepartmentDivipolaKey(department);
  const municipalities = departmentKey ? grouped[departmentKey] : [];
  return sortUniqueByLocale(municipalities);
};

const buildMapParticipationReference = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `MAP-${new Date().getFullYear()}-${timestamp}`;
};


export {
  MAP_PARTICIPATION_DRAFT_STORAGE_KEY,
  MAP_PARTICIPATION_QUEUE_STORAGE_KEY,
  MAP_PARTICIPATION_ACTOR_OPTIONS,
  MAP_PARTICIPATION_ROLE_OPTIONS,
  MAP_PARTICIPATION_SCOPE_OPTIONS,
  MAP_PARTICIPATION_MARKET_FREQUENCY_OPTIONS,
  MAP_PARTICIPATION_FESTIVAL_SETTING_OPTIONS,
  MAP_PARTICIPATION_FESTIVAL_VENUE_OPTIONS,
  MAP_PARTICIPATION_FESTIVAL_ACCESS_OPTIONS,
  MAP_PARTICIPATION_MONTH_OPTIONS,
  MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS,
  MAP_PARTICIPATION_LEGAL_OPTIONS,
  MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS,
  MAP_PARTICIPATION_IDENTITY_COPY,
  MAP_PARTICIPATION_FIELDSETS,
  hasMapParticipationValue,
  getMapParticipationFieldErrorMessage,
  createMapParticipationFormState,
  getMapParticipationMunicipalities,
  buildMapParticipationReference,
};
