# WCAG 2.1 AA Status Matrix

Fecha de corte: 2026-04-28

## Escala
- `OK`: cumple en revisión inicial.
- `Pendiente`: requiere ajuste o validación formal.
- `Bloqueo`: impide cumplimiento AA y debe priorizarse.

## Matriz por módulo

| Módulo | Teclado/Foco | Semántica/Labels | Mensajes de error/estado | Contraste AA | Estado general |
|---|---|---|---|---|---|
| Home + Navegación | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Noticias | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Agenda | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Editorial | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Mapa ecosistémico | Bloqueo | Pendiente | Pendiente | Pendiente | Bloqueo |
| Participación (formulario) | Pendiente | OK | Pendiente | Pendiente | Pendiente |

## Bloqueos actuales detectados
1. El mapa depende de interacción avanzada y no tiene aún una capa equivalente completa de navegación por teclado para todas las acciones de lectura territorial.

## Siguiente iteración recomendada
1. Home/Navegación: foco visible y orden de tabulación en menú desktop/móvil.
2. Participación: `aria-live` para confirmación y errores por campo.
3. Mapa: alternativa textual completa de resultados por territorio y capa.
4. Noticias/Editorial: auditoría de jerarquía de headings y nombres accesibles en acciones secundarias.
