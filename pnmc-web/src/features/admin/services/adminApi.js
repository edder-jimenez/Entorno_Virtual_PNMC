import { fetchApiJson } from '../../../services/http/apiClient.js';

const buildAdminInit = (init = {}) => ({
  ...init,
  credentials: 'include',
  headers: {
    ...(init.headers || {}),
  },
});

export const loginAdmin = ({ email, password }) => fetchApiJson({
  path: '/api/v1/admin/auth/login',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }),
  errorFallback: 'No fue posible iniciar sesion',
});

export const fetchAdminMe = () => fetchApiJson({
  path: '/api/v1/admin/auth/me',
  init: buildAdminInit(),
  errorFallback: 'No hay una sesion administrativa activa',
});

export const logoutAdmin = () => fetchApiJson({
  path: '/api/v1/admin/auth/logout',
  init: buildAdminInit({ method: 'POST' }),
  errorFallback: 'No fue posible cerrar la sesion',
});

export const fetchAdminUsers = () => fetchApiJson({
  path: '/api/v1/admin/auth/users',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar usuarios',
});

export const fetchAllyRequests = (params = {}) => fetchApiJson({
  path: '/api/v1/admin/ally-requests',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar solicitudes de aliado',
});

export const updateAllyRequestStatus = ({ id, status, comment = '' }) => fetchApiJson({
  path: `/api/v1/admin/ally-requests/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  }),
  errorFallback: 'No fue posible actualizar la solicitud de aliado',
});

export const createAllyRequest = (payload) => fetchApiJson({
  path: '/api/v1/admin/ally-requests',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible registrar la solicitud de aliado',
});

export const registerExternalUser = (payload) => fetchApiJson({
  path: '/api/v1/external/auth/register',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible registrar el usuario externo',
});

export const verifyExternalEmail = (payload) => fetchApiJson({
  path: '/api/v1/external/auth/verify-email',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible verificar el correo',
});

export const fetchNotifications = (params = {}) => fetchApiJson({
  path: '/api/v1/notifications',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar notificaciones',
});

export const createAdminNotification = (payload) => fetchApiJson({
  path: '/api/v1/admin/notifications',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible crear la notificacion',
});

export const markNotificationRead = (id) => fetchApiJson({
  path: `/api/v1/notifications/${id}/read`,
  init: buildAdminInit({ method: 'POST' }),
  errorFallback: 'No fue posible marcar la notificacion como leida',
});

export const fetchAllyUsers = () => fetchApiJson({
  path: '/api/v1/ally/users',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar usuarios de la entidad aliada',
});

export const createAllyUser = (payload) => fetchApiJson({
  path: '/api/v1/ally/users',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible crear el usuario de la entidad aliada',
});

export const updateAllyUserStatus = ({ id, isActive }) => fetchApiJson({
  path: `/api/v1/ally/users/${id}/status`,
  init: buildAdminInit({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  }),
  errorFallback: 'No fue posible actualizar el estado del usuario aliado',
});

export const saveAdminUser = (payload) => fetchApiJson({
  path: '/api/v1/admin/auth/users',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible guardar el usuario',
});

export const deleteAdminUser = (id) => fetchApiJson({
  path: `/api/v1/admin/auth/users/${id}`,
  init: buildAdminInit({ method: 'DELETE' }),
  errorFallback: 'No fue posible eliminar el usuario',
});

export const fetchAdminEntities = (params = {}) => fetchApiJson({
  path: '/api/v1/admin/entities',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar entidades',
});

export const fetchAdminEntity = (id) => fetchApiJson({
  path: `/api/v1/admin/entities/${id}`,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar la entidad',
});

export const saveAdminEntity = (payload) => fetchApiJson({
  path: '/api/v1/admin/entities',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible guardar la entidad',
});

export const updateAdminEntityStatus = ({ id, status, comment = '' }) => fetchApiJson({
  path: `/api/v1/admin/entities/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  }),
  errorFallback: 'No fue posible actualizar el estado',
});

export const addAdminEntityRelation = ({ id, targetEntityId, relationshipType, notes = '' }) => fetchApiJson({
  path: `/api/v1/admin/entities/${id}/relations`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetEntityId, relationshipType, notes }),
  }),
  errorFallback: 'No fue posible relacionar entidades',
});

export const fetchAdminSchema = () => fetchApiJson({
  path: '/api/v1/admin/data/schema',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar el esquema administrativo',
});

export const fetchAdminStats = () => fetchApiJson({
  path: '/api/v1/admin/data/stats',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar las estadisticas administrativas',
});

export const fetchAdminMonitor = () => fetchApiJson({
  path: '/api/v1/admin/data/monitor',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar el monitoreo tecnico',
});

export const fetchAdminRecords = ({ moduleId, ...params }) => fetchApiJson({
  path: `/api/v1/admin/data/records/${moduleId}`,
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar los registros del modulo',
});

export const updateAdminRecordStatus = ({
  moduleId,
  id,
  status,
  comment = '',
  rejectionReason = '',
  observedFieldsJson = '',
}) => fetchApiJson({
  path: `/api/v1/admin/data/records/${moduleId}/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment, rejectionReason, observedFieldsJson }),
  }),
  errorFallback: 'No fue posible cambiar el estado del registro',
});

export const createRecordLinkRequest = (payload) => fetchApiJson({
  path: '/api/v1/record-link-requests',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible solicitar la vinculación del registro',
});

export const fetchRecordLinkRequests = (params = {}) => fetchApiJson({
  path: '/api/v1/admin/record-link-requests',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar solicitudes de vinculación',
});

export const updateRecordLinkRequestStatus = ({ id, status, comment = '' }) => fetchApiJson({
  path: `/api/v1/admin/record-link-requests/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  }),
  errorFallback: 'No fue posible actualizar la solicitud de vinculación',
});

export const fetchDuplicateCandidates = (params = {}) => fetchApiJson({
  path: '/api/v1/admin/duplicates',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar posibles duplicados',
});

export const createDuplicateCandidate = (payload) => fetchApiJson({
  path: '/api/v1/admin/duplicates',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible registrar el posible duplicado',
});

export const decideDuplicateCandidate = ({ id, decision, comment = '' }) => fetchApiJson({
  path: `/api/v1/admin/duplicates/${id}/decision`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, comment }),
  }),
  errorFallback: 'No fue posible guardar la decisión sobre el duplicado',
});

export const fetchDataQualityFlags = (params = {}) => fetchApiJson({
  path: '/api/v1/admin/data-quality/flags',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar alertas de calidad de datos',
});

export const createDataQualityFlag = (payload) => fetchApiJson({
  path: '/api/v1/admin/data-quality/flags',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible registrar la alerta de calidad de datos',
});

export const updateDataQualityFlagStatus = ({ id, status }) => fetchApiJson({
  path: `/api/v1/admin/data-quality/flags/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }),
  errorFallback: 'No fue posible actualizar la alerta de calidad de datos',
});

export const fetchDivipolaLocations = (params = {}) => fetchApiJson({
  path: '/api/v1/divipola/locations',
  params,
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar DIVIPOLA',
});

export const fetchDivipolaGrouped = () => fetchApiJson({
  path: '/api/v1/divipola/grouped',
  init: buildAdminInit(),
  errorFallback: 'No fue posible consultar departamentos y municipios',
});

export const upsertAdminRecord = ({ endpoint, payload }) => fetchApiJson({
  path: endpoint,
  init: buildAdminInit({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible guardar el registro administrativo',
});

export const analyzeTextWithAI = ({ text, moduleId }) => fetchApiJson({
  path: '/api/v1/admin/data/ai/analyze',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, moduleId }),
  }),
  errorFallback: 'No fue posible analizar el texto con el asistente de IA',
});

export const importBulkRecords = ({ moduleId, records }) => fetchApiJson({
  path: `/api/v1/admin/data/records/${moduleId}/bulk`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records),
  }),
  errorFallback: 'No fue posible realizar la importación masiva de registros',
});
