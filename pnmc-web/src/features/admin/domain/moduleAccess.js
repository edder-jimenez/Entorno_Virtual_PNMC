export const INTERNAL_ADMIN_MODULES = {
  dashboard: ['webmaster', 'gestor_interno'],
  ecosystem: ['webmaster', 'gestor_interno'],
  communications: ['webmaster', 'gestor_interno'],
  editorial: ['webmaster', 'gestor_interno'],
  site_texts: ['webmaster'],
  base_entities: ['webmaster', 'gestor_interno'],
  review_queue: ['webmaster', 'gestor_interno'],
  governance: ['webmaster', 'gestor_interno'],
  users: ['webmaster'],
  system: ['webmaster'],
  collaborator_management: ['webmaster'],
  account: ['webmaster', 'gestor_interno'],
};

export const COLLABORATOR_PORTAL_MODULES = {
  collaborator_dashboard: ['aliado_admin', 'aliado_editor', 'aliado_lector'],
  collaborator_map: ['aliado_admin', 'aliado_editor', 'aliado_lector'],
  collaborator_records: ['aliado_admin', 'aliado_editor', 'aliado_lector'],
  collaborator_new_record: ['aliado_admin', 'aliado_editor'],
  collaborator_import: ['aliado_admin', 'aliado_editor'],
  collaborator_assistant: ['aliado_admin', 'aliado_editor'],
  collaborator_users: ['aliado_admin'],
  collaborator_account: ['aliado_admin', 'aliado_editor', 'aliado_lector'],
};

export const canAccessInternalModule = (roleId, moduleId) => (
  INTERNAL_ADMIN_MODULES[moduleId]?.includes(roleId) ?? false
);

export const canAccessCollaboratorModule = (roleId, moduleId) => (
  COLLABORATOR_PORTAL_MODULES[moduleId]?.includes(roleId) ?? false
);
