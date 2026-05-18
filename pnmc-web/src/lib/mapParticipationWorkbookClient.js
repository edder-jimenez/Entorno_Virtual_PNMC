import { MAP_PARTICIPATION_WORKBOOK_FILE_NAME } from './mapParticipationWorkbookSchema.js';
import { fetchApiJson } from '../services/http/apiClient.js';


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
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('No fue posible guardar la ficha automáticamente en el archivo Excel por tiempo de espera agotado.');
    }

    if (error instanceof TypeError) {
      throw new Error('No fue posible conectar la web con el guardado automático del Excel. Verifica que estés ejecutando el proyecto desde el servidor local.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('No fue posible guardar la ficha automáticamente en el archivo Excel.');
  }

  return {
    mode: 'server',
    fileName: payload?.fileName || MAP_PARTICIPATION_WORKBOOK_FILE_NAME,
    message: payload?.message || 'La ficha quedó guardada automáticamente en la base Excel del proyecto.',
  };
};
