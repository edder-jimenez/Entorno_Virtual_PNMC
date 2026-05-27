import { MAP_PARTICIPATION_WORKBOOK_FILE_NAME } from './mapParticipationWorkbookSchema.js';
import { ApiError, fetchApiJson } from '../services/http/apiClient.js';


export { MAP_PARTICIPATION_WORKBOOK_FILE_NAME };

export const persistMapParticipationWorkbook = async ({ submissionPayload }) => {
  let payload = null;

  try {
    payload = await fetchApiJson({
      path: '/api/map-participation',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      },
      errorFallback: 'No fue posible guardar la ficha automáticamente en el archivo Excel',
      timeoutMs: 20000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error('[NETWORK] No fue posible conectar la web con el guardado automatico del Excel. Verifica que la API local este activa.');
    }

    if (error instanceof Error) {
      throw new Error(`[CLIENT_PARTICIPATION_SAVE] No fue posible guardar la ficha automaticamente en el archivo Excel. Detalle: ${error.message}`);
    }

    throw new Error('[CLIENT_PARTICIPATION_SAVE] No fue posible guardar la ficha automaticamente en el archivo Excel. Detalle: error desconocido.');
  }

  return {
    mode: 'server',
    fileName: payload?.fileName || MAP_PARTICIPATION_WORKBOOK_FILE_NAME,
    message: payload?.message || 'La ficha quedó guardada automáticamente en la base Excel del proyecto.',
  };
};
