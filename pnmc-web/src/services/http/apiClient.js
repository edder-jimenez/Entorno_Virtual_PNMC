const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value);

const HTTP_STATUS_LABELS = {
  400: 'Solicitud invalida',
  401: 'No autenticado',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  409: 'Conflicto de datos',
  422: 'Validacion fallida',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
  502: 'Backend no disponible',
  503: 'Servicio no disponible',
  504: 'Tiempo de espera del servidor',
};

export class ApiError extends Error {
  constructor(message, {
    code = 'API_ERROR',
    status = null,
    path = '',
    payload = null,
    requestId = '',
    technicalMessage = '',
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.path = path;
    this.payload = payload;
    this.requestId = requestId;
    this.technicalMessage = technicalMessage;
  }
}

const normalizeMessagePart = (value) => (
  typeof value === 'string' ? value.trim() : ''
);

const extractValidationMessage = (errors = {}) => Object.entries(errors)
  .flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages
      .map((message) => normalizeMessagePart(message))
      .filter(Boolean)
      .map((message) => `${field}: ${message}`);
  })
  .join(' ');

const extractPayloadMessage = (payload) => {
  if (!payload || typeof payload !== 'object') return '';

  const validationMessage = payload.errors && typeof payload.errors === 'object'
    ? extractValidationMessage(payload.errors)
    : '';

  return (
    validationMessage
    || normalizeMessagePart(payload.detail)
    || normalizeMessagePart(payload.message)
    || normalizeMessagePart(payload.title)
  );
};

const extractRequestId = (payload) => (
  normalizeMessagePart(payload?.traceId)
  || normalizeMessagePart(payload?.requestId)
  || normalizeMessagePart(payload?.correlationId)
  || normalizeMessagePart(payload?.extensions?.traceId)
);

const buildErrorMessage = ({
  code,
  fallback,
  status = null,
  detail = '',
  path = '',
  requestId = '',
}) => {
  const statusLabel = status ? HTTP_STATUS_LABELS[status] : '';
  const parts = [`[${code}] ${fallback}`];

  if (status) {
    parts.push(`Estado HTTP: ${status}${statusLabel ? ` ${statusLabel}` : ''}`);
  }

  if (detail) {
    parts.push(`Detalle: ${detail}`);
  }

  if (path) {
    parts.push(`Ruta: ${path}`);
  }

  if (requestId) {
    parts.push(`ID de solicitud: ${requestId}`);
  }

  return parts.join(' | ');
};

const buildUserErrorMessage = ({
  code,
  fallback,
  detail = '',
}) => {
  const cleanFallback = normalizeMessagePart(fallback).replace(/[.!?]+$/, '');
  const cleanDetail = normalizeMessagePart(detail).replace(/[.!?]+$/, '');
  const parts = [cleanFallback || 'Ocurrió un error inesperado'];

  if (cleanDetail) {
    parts.push(cleanDetail);
  }

  return `${parts.join('. ')}. Código: ${code}.`;
};

export const buildApiUrl = (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const resolvedPath = isAbsoluteUrl(path) ? path : `${API_BASE_URL}${path}`;
  return `${resolvedPath}${query ? `?${query}` : ''}`;
};

export const generateCorrelationId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const fetchApiJson = async ({
  path,
  params = {},
  init = {},
  errorFallback = 'Error al consultar backend',
  timeoutMs = 20000,
}) => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const url = buildApiUrl(path, params);
  const correlationId = generateCorrelationId();

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'X-Correlation-ID': correlationId,
        ...(init.headers || {}),
      },
      signal: init.signal || controller.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const code = `HTTP_${response.status}`;
      const requestId = extractRequestId(payload);
      const detail = extractPayloadMessage(payload);

      const technicalMessage = buildErrorMessage({
        code,
        fallback: errorFallback,
        status: response.status,
        detail,
        path: url,
        requestId,
      });

      throw new ApiError(
        buildUserErrorMessage({
          code,
          fallback: errorFallback,
          detail,
        }),
        {
          code,
          status: response.status,
          path: url,
          payload,
          requestId,
          technicalMessage,
        }
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      const detail = `La solicitud superó ${timeoutMs} ms.`;
      const technicalMessage = buildErrorMessage({
        code: 'TIMEOUT',
        fallback: errorFallback,
        detail,
        path: url,
      });

      throw new ApiError(
        buildUserErrorMessage({
          code: 'TIMEOUT',
          fallback: errorFallback,
          detail: 'La solicitud tardo demasiado en responder',
        }),
        {
          code: 'TIMEOUT',
          path: url,
          technicalMessage,
        }
      );
    }

    if (error instanceof TypeError) {
      const detail = 'No fue posible conectar con el servidor. Verifica que la API este activa y que la URL base sea correcta.';
      const technicalMessage = buildErrorMessage({
        code: 'NETWORK',
        fallback: errorFallback,
        detail,
        path: url,
      });

      throw new ApiError(
        buildUserErrorMessage({
          code: 'NETWORK',
          fallback: errorFallback,
          detail: 'No fue posible conectar con el servidor',
        }),
        {
          code: 'NETWORK',
          path: url,
          technicalMessage,
        }
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};
