import { HttpErrorResponse } from '@angular/common/http';

function tryExtractMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === 'string') return payload.trim() || null;
  if (typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const message = record['message'];
  if (typeof message === 'string' && message.trim()) return message.trim();

  const detail = record['detail'];
  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  const title = record['title'];
  if (typeof title === 'string' && title.trim()) return title.trim();

  return null;
}

export function toApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'No pudimos conectar con el backend. Verifica que el API .NET esté encendida.';
  }

  if (error.status === 502) {
    return 'Error al consultar backend (502). Verifica backend .NET y conexión a Azure SQL.';
  }

  const fromPayload = tryExtractMessage(error.error);
  if (fromPayload) return fromPayload;

  if (error.message?.trim()) return error.message.trim();
  return fallback;
}
