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

export const saveAdminUser = (payload) => fetchApiJson({
  path: '/api/v1/admin/auth/users',
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  errorFallback: 'No fue posible guardar el usuario',
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

export const updateAdminRecordStatus = ({ moduleId, id, status }) => fetchApiJson({
  path: `/api/v1/admin/data/records/${moduleId}/${id}/status`,
  init: buildAdminInit({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }),
  errorFallback: 'No fue posible cambiar el estado del registro',
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

