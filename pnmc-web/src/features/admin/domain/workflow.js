export const CONTENT_STATUSES = {
  draft: 'borrador',
  review: 'en_revision',
  changesRequested: 'ajustes_solicitados',
  approved: 'aprobado',
  published: 'publicado',
  rejected: 'rechazado',
  archived: 'archivado',
};

export const STATUS_TRANSITIONS = {
  borrador: ['en_revision'],
  en_revision: ['ajustes_solicitados', 'aprobado', 'rechazado'],
  ajustes_solicitados: ['en_revision'],
  aprobado: ['publicado'],
  publicado: ['archivado'],
  rechazado: [],
  archivado: [],
};

export const REVIEW_ACTION_BY_STATUS = {
  en_revision: 'submit_review',
  ajustes_solicitados: 'request_changes',
  aprobado: 'approve',
  rechazado: 'reject',
  publicado: 'publish',
  archivado: 'archive',
};

export const canTransitionStatus = ({ roleId, fromStatus, toStatus, moduleConfig = {} }) => {
  const role = roleId;
  if (!STATUS_TRANSITIONS[fromStatus]?.includes(toStatus)) return false;
  if (role === 'webmaster') return true;

  if (role === 'gestor_interno') {
    if (['ajustes_solicitados', 'aprobado', 'rechazado'].includes(toStatus)) return true;
    if (toStatus === 'publicado') return moduleConfig.allowGestorPublish === true;
    if (toStatus === 'archivado') return moduleConfig.allowGestorArchive === true;
  }

  if (['aliado_admin', 'aliado_editor'].includes(role)) {
    return ['borrador', 'ajustes_solicitados'].includes(fromStatus) && toStatus === 'en_revision';
  }

  return false;
};
