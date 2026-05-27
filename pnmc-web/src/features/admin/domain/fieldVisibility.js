export const FIELD_VISIBILITY = {
  public: 'publico',
  privateAdmin: 'privado_administrativo',
  reviewOnly: 'solo_revision',
  reportsOnly: 'solo_reportes',
};

export const MAP_FIELD_VISIBILITY = {
  name: FIELD_VISIBILITY.public,
  actorType: FIELD_VISIBILITY.public,
  department: FIELD_VISIBILITY.public,
  municipality: FIELD_VISIBILITY.public,
  description: FIELD_VISIBILITY.public,
  websiteUrl: FIELD_VISIBILITY.public,
  facebookUrl: FIELD_VISIBILITY.public,
  instagramUrl: FIELD_VISIBILITY.public,
  otherUrl: FIELD_VISIBILITY.public,
  responsibleEntity: FIELD_VISIBILITY.reportsOnly,
  coverageLevel: FIELD_VISIBILITY.public,
  musicalPractices: FIELD_VISIBILITY.public,
  sonorousTerritories: FIELD_VISIBILITY.public,
  trainingProcesses: FIELD_VISIBILITY.reportsOnly,
  contactEmail: FIELD_VISIBILITY.privateAdmin,
  contactPhone: FIELD_VISIBILITY.privateAdmin,
  observations: FIELD_VISIBILITY.reviewOnly,
  reviewHistory: FIELD_VISIBILITY.reviewOnly,
};

export const canReadField = ({ visibility, canReadAdministrative = false, canReadReports = false, canReadReview = false }) => {
  if (visibility === FIELD_VISIBILITY.privateAdmin) return canReadAdministrative;
  if (visibility === FIELD_VISIBILITY.reportsOnly) return canReadReports;
  if (visibility === FIELD_VISIBILITY.reviewOnly) return canReadReview;
  return visibility === FIELD_VISIBILITY.public;
};
