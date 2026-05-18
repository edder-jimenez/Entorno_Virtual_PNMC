export type ActorType = 'individual' | 'collective' | 'organization' | 'festival' | 'market' | 'space';

export interface ActorOption {
  key: ActorType;
  label: string;
  description: string;
}

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'date';

export interface DynamicField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  min?: number;
  max?: number;
  rows?: number;
}

export interface IdentityCopy {
  actorNameLabel: string;
  actorNamePlaceholder: string;
  showResponsibleEntity: boolean;
  responsibleEntityLabel: string;
  responsibleEntityPlaceholder: string;
  showContactFields: boolean;
  contactNameLabel: string;
  contactRoleLabel: string;
  showIdentificationFields: boolean;
  showTerritoryScope: boolean;
  showWebsite: boolean;
  showSocialFields: boolean;
  showRoleSection?: boolean;
}

export const PARTICIPATION_DRAFT_STORAGE_KEY = 'pnmc-angular-participation-draft-v1';

export const ACTOR_OPTIONS: ActorOption[] = [
  {
    key: 'individual',
    label: 'Registro individual',
    description: 'Músicos, gestores, formadores, investigadores y otros perfiles individuales.',
  },
  {
    key: 'collective',
    label: 'Agrupación o colectivo',
    description: 'Bandas, ensambles y colectivos creativos con práctica musical activa.',
  },
  {
    key: 'organization',
    label: 'Organización',
    description: 'Fundaciones, corporaciones, asociaciones y entidades del ecosistema musical.',
  },
  {
    key: 'festival',
    label: 'Festival',
    description: 'Festivales, circuitos y encuentros que activan programación musical.',
  },
  {
    key: 'market',
    label: 'Mercado',
    description: 'Mercados, vitrinas o plataformas de conexión profesional.',
  },
  {
    key: 'space',
    label: 'Sala o espacio',
    description: 'Infraestructuras donde ocurren prácticas, ensayos o circulación musical.',
  },
];

export const ROLE_OPTIONS_BY_ACTOR: Record<string, string[]> = {
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
    'Técnica de sonido',
    'Lutería',
    'Programación',
    'Preservación',
    'Emprendimiento',
    'Otra',
  ],
};

export const SCOPE_OPTIONS = ['Comunitario', 'Municipal', 'Departamental', 'Regional', 'Nacional', 'Internacional'];
export const IDENTIFICATION_TYPE_OPTIONS = [
  'Cédula de ciudadanía',
  'Tarjeta de identidad',
  'Cédula de extranjería',
  'Pasaporte',
  'Permiso por protección temporal',
  'Otro',
];
export const LEGAL_OPTIONS = ['Sí', 'No', 'En trámite'];
export const PERIODICITY_OPTIONS = ['Anual', 'Bienal', 'Semestral', 'Trimestral', 'Otra'];
export const FESTIVAL_SETTING_OPTIONS = ['Principalmente urbano', 'Principalmente rural', 'Mixto'];
export const FESTIVAL_VENUE_OPTIONS = ['Una sola ciudad o municipio', 'Varias ciudades o municipios'];
export const FESTIVAL_ACCESS_OPTIONS = [
  'Entrada gratuita en toda la programación',
  'Pago en toda la programación',
  'Algunas actividades gratuitas y otras de pago',
];
export const MONTH_OPTIONS = [
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
export const CURRENT_YEAR_OPTIONS = ['Ya se realizó', 'Se va a realizar', 'Está por confirmar'];

export const IDENTITY_BY_ACTOR: Record<ActorType, IdentityCopy> = {
  individual: {
    actorNameLabel: 'Nombre completo',
    actorNamePlaceholder: 'Escribe el nombre completo',
    showResponsibleEntity: false,
    responsibleEntityLabel: '',
    responsibleEntityPlaceholder: '',
    showContactFields: false,
    contactNameLabel: '',
    contactRoleLabel: '',
    showIdentificationFields: true,
    showTerritoryScope: false,
    showWebsite: true,
    showSocialFields: true,
  },
  collective: {
    actorNameLabel: 'Nombre de la agrupación o colectivo',
    actorNamePlaceholder: 'Escribe el nombre de la agrupación o colectivo',
    showResponsibleEntity: true,
    responsibleEntityLabel: 'Nombre jurídico o razón social (si aplica)',
    responsibleEntityPlaceholder: 'Escribe el nombre jurídico si existe',
    showContactFields: true,
    contactNameLabel: 'Persona de contacto',
    contactRoleLabel: 'Rol dentro de la agrupación',
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    showSocialFields: true,
  },
  organization: {
    actorNameLabel: 'Nombre de la organización',
    actorNamePlaceholder: 'Escribe el nombre de la organización',
    showResponsibleEntity: true,
    responsibleEntityLabel: 'Razón social o nombre jurídico',
    responsibleEntityPlaceholder: 'Escribe la razón social o nombre jurídico',
    showContactFields: true,
    contactNameLabel: 'Persona de contacto',
    contactRoleLabel: 'Cargo o rol',
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    showSocialFields: true,
  },
  festival: {
    actorNameLabel: 'Nombre del festival',
    actorNamePlaceholder: 'Escribe el nombre del festival',
    showResponsibleEntity: true,
    responsibleEntityLabel: 'Entidad u organización responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad responsable',
    showContactFields: true,
    contactNameLabel: 'Persona de contacto del festival',
    contactRoleLabel: 'Rol dentro del festival',
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    showSocialFields: true,
  },
  market: {
    actorNameLabel: 'Nombre del mercado musical',
    actorNamePlaceholder: 'Escribe el nombre del mercado musical',
    showResponsibleEntity: true,
    responsibleEntityLabel: 'Entidad u organización responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad responsable',
    showContactFields: true,
    contactNameLabel: 'Persona de contacto del mercado',
    contactRoleLabel: 'Rol dentro del mercado',
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    showSocialFields: true,
    showRoleSection: false,
  },
  space: {
    actorNameLabel: 'Nombre de la sala o espacio',
    actorNamePlaceholder: 'Escribe el nombre de la sala o espacio',
    showResponsibleEntity: true,
    responsibleEntityLabel: 'Entidad o administración responsable',
    responsibleEntityPlaceholder: 'Escribe la entidad o administración',
    showContactFields: true,
    contactNameLabel: 'Persona de contacto',
    contactRoleLabel: 'Rol dentro de la sala o espacio',
    showIdentificationFields: false,
    showTerritoryScope: true,
    showWebsite: true,
    showSocialFields: true,
  },
};

export const FIELDSETS_BY_ACTOR: Record<ActorType, DynamicField[]> = {
  organization: [
    { key: 'organizationSubtype', label: 'Tipo de organización', type: 'select', options: ['Fundación', 'Corporación', 'Asociación', 'Colectivo', 'Entidad pública', 'Emprendimiento cultural', 'Otra'] },
    { key: 'yearFounded', label: 'Año de creación', type: 'number', min: 1900, max: 2100 },
    { key: 'legalStatus', label: 'Constitución legal', type: 'select', options: LEGAL_OPTIONS },
    { key: 'mainPrograms', label: 'Líneas o programas principales', type: 'textarea', rows: 4 },
  ],
  festival: [
    { key: 'festivalDurationDays', label: '¿Cuántos días dura el festival?', type: 'number', min: 1 },
    { key: 'festivalSetting', label: '¿Dónde se desarrolla principalmente?', type: 'select', options: FESTIVAL_SETTING_OPTIONS },
    { key: 'festivalVenueMode', label: '¿Una ciudad o varias?', type: 'select', options: FESTIVAL_VENUE_OPTIONS },
    { key: 'festivalFrequency', label: 'Periodicidad', type: 'select', options: PERIODICITY_OPTIONS },
    { key: 'festivalVersions', label: 'Número de ediciones', type: 'number', min: 0 },
    { key: 'festivalTicketing', label: 'Tipo de acceso al público', type: 'select', options: FESTIVAL_ACCESS_OPTIONS },
    { key: 'openCall', label: '¿Normalmente hacen convocatoria abierta?', type: 'select', options: ['Sí', 'No'] },
    { key: 'festivalThisYearStatus', label: 'Estado este año', type: 'select', options: CURRENT_YEAR_OPTIONS },
  ],
  market: [
    { key: 'marketFrequency', label: 'Periodicidad', type: 'select', options: PERIODICITY_OPTIONS },
    { key: 'marketEditionsCount', label: 'Número de ediciones', type: 'number', min: 0 },
    { key: 'averageBuyers', label: 'Promedio de compradores por edición', type: 'number', min: 0 },
    { key: 'linkedFestival', label: '¿Articulado con festival?', type: 'select', options: ['Sí', 'No'] },
    { key: 'marketThisYearStatus', label: 'Estado este año', type: 'select', options: CURRENT_YEAR_OPTIONS },
  ],
  individual: [
    { key: 'individualProfile', label: 'Perfil principal', type: 'select', options: ['Músico o intérprete', 'Compositor o creador', 'Gestor o productor', 'Docente o formador', 'Investigador', 'Técnico o luthier', 'Comunicador cultural', 'Otro'] },
    { key: 'trajectoryYears', label: 'Años de trayectoria', type: 'number', min: 0 },
    { key: 'linkedProcesses', label: 'Procesos o redes vinculadas', type: 'textarea', rows: 4 },
  ],
  collective: [
    { key: 'members', label: 'Número de integrantes', type: 'number', min: 0 },
    { key: 'musicalPractice', label: 'Práctica o género principal', type: 'text' },
    { key: 'circulationScope', label: 'Alcance de circulación', type: 'select', options: SCOPE_OPTIONS },
    { key: 'collectiveTrajectory', label: 'Trayectoria o hitos recientes', type: 'textarea', rows: 4 },
  ],
  space: [
    { key: 'spaceType', label: 'Tipo de espacio', type: 'select', options: ['Teatro', 'Casa cultural', 'Centro comunitario', 'Sala de conciertos', 'Estudio', 'Espacio alternativo'] },
    { key: 'spaceCapacity', label: 'Capacidad aproximada', type: 'number', min: 0 },
    { key: 'spaceUses', label: 'Usos principales del espacio', type: 'textarea', rows: 4 },
    { key: 'technicalEquipment', label: 'Dotación o equipamiento disponible', type: 'textarea', rows: 4 },
  ],
};
