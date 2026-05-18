# WCAG 2.1 AA Execution Checklist (PNMC)

## Objetivo
Checklist operativo para validar accesibilidad de cada release sin cambiar la identidad visual del sitio.

## Alcance por módulo
- Home y navegación global
- Noticias
- Agenda
- Editorial
- Mapa ecosistémico
- Formulario de participación

## Regla de ejecución
1. Probar con teclado únicamente.
2. Probar con lector de pantalla (VoiceOver/NVDA).
3. Verificar contraste AA con herramienta (axe/Lighthouse/WAVE).
4. Registrar evidencia por módulo (OK / pendiente / bloqueo).

## Checklist global
- [ ] Existe un `h1` único y descriptivo por vista.
- [ ] El orden visual coincide con el orden de foco.
- [ ] Todos los elementos interactivos son alcanzables por `Tab`.
- [ ] Se ve foco visible en botones, links, inputs y controles custom.
- [ ] No hay trampas de teclado en modales, overlays o menús.
- [ ] Los formularios tienen `label` asociado y texto de ayuda claro.
- [ ] Los errores se anuncian de forma programática (`aria-live` o equivalente).
- [ ] Imágenes informativas tienen `alt` significativo.
- [ ] Iconos decorativos no generan ruido al lector de pantalla.
- [ ] Contraste texto-fondo cumple AA.

## Home y navegación
- [ ] Menú desktop y menú móvil son operables por teclado.
- [ ] Dropdowns/categorías de ejes pueden abrir/cerrar sin mouse.
- [ ] Banners rotativos tienen control manual y foco estable.
- [ ] Enlaces "Ir a sección" no rompen contexto de lectura.

## Noticias
- [ ] Tarjetas destacadas son activables por teclado.
- [ ] Filtros de fecha/categoría son navegables y legibles.
- [ ] Contenido enriquecido renderizado mantiene semántica correcta.
- [ ] Acciones de compartir tienen nombre accesible.

## Agenda
- [ ] Lista de eventos permite navegación por teclado sin bloqueo.
- [ ] Botón de “ver calendario completo” tiene propósito claro.
- [ ] Estado vacío, loading y error son anunciados correctamente.

## Editorial
- [ ] Buscador simple y avanzado son accesibles por teclado.
- [ ] Tablas/listados tienen encabezados y lectura consistente.
- [ ] Botones de expandir detalle informan estado (expandido/colapsado).

## Mapa ecosistémico
- [ ] Controles de zoom/capas son operables por teclado.
- [ ] Existe alternativa textual a insights clave del mapa.
- [ ] Tooltips/popups no son la única forma de acceder a datos.
- [ ] Cambios de filtro territorial actualizan texto de estado visible.

## Participación (formulario)
- [ ] Cada campo obligatorio se identifica de forma clara.
- [ ] Mensajes de validación son específicos por campo.
- [ ] El envío fallido devuelve foco al primer error.
- [ ] Confirmación de envío es visible y anunciada.
- [ ] Consentimiento tiene etiqueta explícita y clickeable.

## Criterio de salida
Se considera release apto cuando:
- 100% de ítems críticos de teclado/foco/errores están en OK.
- No existen bloqueos AA en contraste, nombre accesible ni navegación.
- Cualquier excepción queda registrada con fecha, responsable y plan de remediación.
