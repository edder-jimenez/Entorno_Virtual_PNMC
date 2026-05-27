import { ADMIN_ROLES } from './adminConfig.js';
import { canTransitionStatus } from './workflow.js';

export const hasRoleAction = (roleId, action) => (
  ADMIN_ROLES[roleId]?.capabilities.includes(action) ?? false
);

export const canPerformAdminAction = ({
  roleId,
  action,
  moduleConfig = {},
  record = {},
  session = {},
}) => {
  const role = roleId;
  if (role === 'webmaster') return true;
  if (!hasRoleAction(role, action)) return false;

  if (action === 'publish') {
    return role === 'gestor_interno' && moduleConfig.allowGestorPublish === true;
  }

  if (action === 'archive') {
    return role === 'gestor_interno' && moduleConfig.allowGestorArchive === true;
  }

  if (['manage_global_users', 'manage_site_texts', 'manage_system', 'view_audit'].includes(action)) {
    return false;
  }

  if (['edit_own', 'edit_entity_records'].includes(action)) {
    const editableStatus = ['borrador', 'ajustes_solicitados'].includes(record.status);
    const sameOwner = record.ownerId && session?.id && String(record.ownerId) === String(session.id);
    const sameEntity = record.entidadAliadaId && session?.entidadAliadaId
      && String(record.entidadAliadaId) === String(session.entidadAliadaId);
    return editableStatus && (sameOwner || sameEntity);
  }

  return true;
};

export const canPerformStatusTransition = ({
  roleId,
  fromStatus,
  toStatus,
  moduleConfig = {},
}) => canTransitionStatus({ roleId, fromStatus, toStatus, moduleConfig });
