const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value);

export const buildApiUrl = (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const resolvedPath = isAbsoluteUrl(path) ? path : `${API_BASE_URL}${path}`;
  return `${resolvedPath}${query ? `?${query}` : ''}`;
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

  try {
    const response = await fetch(buildApiUrl(path, params), {
      ...init,
      headers: {
        Accept: 'application/json',
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
      throw new Error(
        payload?.detail
        || payload?.message
        || payload?.title
        || `${errorFallback} (${response.status}).`
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`${errorFallback} (timeout).`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};
