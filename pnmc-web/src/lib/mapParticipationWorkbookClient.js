import { MAP_PARTICIPATION_WORKBOOK_FILE_NAME } from './mapParticipationWorkbookSchema.js';


export { MAP_PARTICIPATION_WORKBOOK_FILE_NAME };

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const persistMapParticipationWorkbook = async ({ submissionPayload }) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/map-participation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionPayload),
    });
  } catch {
    throw new Error('No fue posible conectar la web con el guardado automático del Excel. Verifica que estés ejecutando el proyecto desde el servidor local.');
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.message || 'No fue posible guardar la ficha automáticamente en el archivo Excel.'
    );
  }

  return {
    mode: 'server',
    fileName: payload?.fileName || MAP_PARTICIPATION_WORKBOOK_FILE_NAME,
    message: payload?.message || 'La ficha quedó guardada automáticamente en la base Excel del proyecto.',
  };
};
