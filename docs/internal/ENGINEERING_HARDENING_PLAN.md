# PNMC Engineering Hardening Plan

## Objetivo
Blindar PNMC en seguridad, calidad, accesibilidad y mantenibilidad sin alterar la experiencia visual actual.

## Alcance actual
- Frontend: `pnmc-web` (React, UI intacta)
- Backend: `pnmc-api` (.NET 10 + EF Core)
- Base de datos: `pnmc-database` (Azure SQL como fuente de verdad)

## Principios de implementación
1. No romper funcionalidad en producción.
2. No cambiar diseño visual.
3. Cambios incrementales por lotes pequeños.
4. Todo ajuste debe tener validación automática (tests/lint/checklist).
5. Seguridad y datos por defecto (secure-by-default).

## Backlog priorizado

### P0 (inmediato)
- Endpoints sensibles protegidos (admin y escritura).
- Validación y sanitización robusta de formularios en backend.
- Rate limiting en endpoints de alto riesgo (submissions).
- Manejo uniforme de errores y códigos HTTP.
- Contratos de API validados con pruebas.

### P1 (siguiente iteración)
- Separar componentes de gran tamaño (`App.jsx`) por dominio.
- Introducir capa de validación de DTOs reutilizable.
- Endurecer renderizado de HTML dinámico (sanitización segura).
- Estandarizar observabilidad (request-id, trazas, auditoría).
- Cobertura de pruebas funcionales por módulo (agenda, noticias, editorial, mapa, participación).

### P2 (estabilización)
- Política de seguridad de headers y CSP.
- Métricas SLO/SLI de API y alertas.
- Catálogo de deuda técnica con SLA.
- Plan de transición frontend React -> Angular (sin migrar aún).

## Seguridad (OWASP orientado)
- Entrada: validar/sanitizar en backend siempre (no confiar en frontend).
- Salida: escapar/sanitizar HTML dinámico.
- Transporte: TLS obligatorio y credenciales fuera de git.
- Autorización: endpoints de administración con control explícito.
- Abuso: rate limiting y límites de payload.
- Secretos: `.env` local + Azure App Settings/Key Vault en despliegue.

## WCAG 2.1 AA (checklist operativo)
- Perceptible:
  - Contraste mínimo AA en texto y controles.
  - Texto alternativo en imágenes relevantes.
- Operable:
  - Navegación por teclado completa.
  - Foco visible en todos los controles interactivos.
  - Sin trampas de teclado.
- Comprensible:
  - Etiquetas y errores de formulario claros.
  - Mensajes de estado con `aria-live` donde aplique.
- Robusto:
  - Semántica HTML correcta (landmarks, headings, labels).
  - Roles ARIA solo cuando sean necesarios.

## Normalización de datos (1FN-3FN)

### Dominio territorial y contenidos
- 1FN:
  - Evitar columnas multivalor no controladas.
  - Tipos consistentes para DIVIPOLA y fechas.
- 2FN:
  - Dependencia completa de clave en tablas puente (ej. relaciones entre procesos/entidades).
- 3FN:
  - Quitar dependencias transitivas (catálogos de estado/categoría separados).

### Línea de trabajo SQL
1. Inventario de tablas activas por módulo.
2. Mapa de claves primarias/foráneas e índices.
3. Script de constraints faltantes (FK, UNIQUE, CHECK).
4. Scripts de migración versionados en `pnmc-database/migrations`.

## Estándares de código
- Frontend:
  - Componentes visuales separados de servicios y mapeadores.
  - Servicios de datos sin dependencias de React (preparación Angular).
- Backend:
  - Endpoints finos, validación centralizada, lógica en servicios.
  - DTOs/contratos explícitos y testeados.

## Definición de terminado (DoD)
Un ítem queda cerrado solo si:
1. Tiene pruebas automáticas o evidencia verificable.
2. No rompe módulos existentes.
3. Está documentado en README o `docs/internal` si aplica.
4. Cumple seguridad, accesibilidad y manejo de errores base.

## Avance ejecutado (2026-04-28)
- P0 implementado:
  - Rate limiting para envíos de participación.
  - Validación/sanitización backend en formularios de participación.
  - Protección por API key para endpoints administrativos.
- P1 en ejecución:
  - Capa HTTP unificada en frontend (`src/services/http/apiClient.js`) para desacoplar consumo de datos.
  - Sanitización de HTML dinámico en backend y frontend para noticias y vistas enriquecidas del mapa.
  - Correlation ID (`X-Correlation-ID`) agregado al backend para trazabilidad básica.
  - Cabeceras de seguridad HTTP base (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) agregadas por middleware.
  - Validación de URLs HTTP/HTTPS en formularios de participación y hardening null-safe para listas del payload.
  - Segmentación incremental de `App.jsx`: se extrajeron bloques de Home a `features/home/components`.
  - Segmentación adicional: la versión activa del mapa quedó en `pnmc-web/src/features/map/pages/MapaEcosistemicoPage.jsx`; la implementación previa fue archivada fuera del flujo activo.
  - Segmentación adicional: `GaleriaPage` y `SobreElPnmcPage` se movieron a `pnmc-web/src/features/gallery/pages/GaleriaPage.jsx` para desacoplar páginas de contenido del shell principal.
  - Segmentación adicional: `ComponentSubPage`, `ComponentRoutePage` y `UnknownRoutePage` se movieron a `pnmc-web/src/features/content/pages/ComponentPages.jsx`, pasando `ejesData` por props para reducir acoplamiento en `App.jsx`.
  - Segmentación adicional: `MapaParticipaPage` se movió a `pnmc-web/src/features/participation/pages/MapaParticipaPage.jsx` para separar el formulario avanzado de participación del shell de rutas.
  - Segmentación adicional: `StrategySubPage` + `strategyPageContent` + `strategyRelatedComponentsMap` se movieron a `pnmc-web/src/features/content/pages/StrategySubPage.jsx`.
  - Segmentación adicional: `AxisSection` y `EjesPage` se movieron a `pnmc-web/src/features/content/pages/EjesPage.jsx`, y `ejesDataGlobal` se movió a `pnmc-web/src/features/content/domain/ejesData.js`.
  - Segmentación adicional: la definición completa de rutas se extrajo a `pnmc-web/src/app/AppRoutes.jsx`, dejando `App.jsx` como shell de navegación/estado.
  - Segmentación adicional: estilos globales del shell movidos a `pnmc-web/src/app/AppGlobalStyles.jsx` para aislar responsabilidades de presentación global.
  - Segmentación adicional: CTA flotante de estrategia movido a `pnmc-web/src/app/AppFloatingStrategyButton.jsx` para simplificar el shell principal.
  - Rendimiento frontend: `AppRoutes` ahora usa `React.lazy` + `Suspense` por página para cargar módulos bajo demanda y reducir el bundle inicial.
  - Rendimiento frontend: precarga de rutas críticas en tiempo ocioso (`pnmc-web/src/app/appRoutePreload.js`) para mejorar respuesta de navegación sin inflar la carga inicial.
  - Segmentación adicional en mapa: paneles de resumen territorial extraídos a `pnmc-web/src/features/map/components/MapSummaryPanels.jsx` para reducir complejidad de `MapaEcosistemicoPage`.
  - Segmentación adicional en mapa: panel de consulta especializada y señales automáticas extraído a `pnmc-web/src/features/map/components/MapTechnicalOverviewPanel.jsx`.
  - Segmentación adicional en mapa: matriz territorial y tabla de registros técnicos extraídas a `pnmc-web/src/features/map/components/MapTechnicalDataTablesPanel.jsx`.
  - Segmentación adicional en mapa: cabecera/estado del detalle territorial extraídos a `pnmc-web/src/features/map/components/MapDepartmentDetailPanel.jsx`.
  - Segmentación adicional en mapa: tarjeta colapsable por sección territorial extraída a `pnmc-web/src/features/map/components/MapDepartmentSectionCard.jsx`.
  - Segmentación adicional en mapa: contenido de detalle por capa (`Festivales`, `Escuelas de Música`, `Mercados Musicales`) extraído a `pnmc-web/src/features/map/components/MapDepartmentSectionContent.jsx`, reduciendo tamaño y acoplamiento de `MapaEcosistemicoPage`.
  - Segmentación adicional en participación: bloque completo de "información específica por tipo de actor" extraído a `pnmc-web/src/features/participation/components/ParticipationSpecificSection.jsx`, reduciendo tamaño y complejidad de `MapaParticipaPage`.
  - Blindaje de runtime frontend: `AppErrorBoundary` global para evitar pantallas en blanco ante errores no controlados.
  - Base SQL con migraciones versionadas de índices y constraints seguros.
  - Checklist operativo WCAG 2.1 AA por módulo en `docs/internal/WCAG_2_1_AA_EXECUTION_CHECKLIST.md`.
  - Matriz inicial de estado AA en `docs/internal/WCAG_2_1_AA_STATUS_MATRIX.md`.
  - Validación técnica en verde tras segmentaciones: `npm run lint`, `npm run build`, `npm test -- --run` y `dotnet test PNMC.Api.sln`.

## Criterio para iniciar migración Angular
- Backend estable y desacoplado del frontend: **cumplido**.
- Fuente única de datos en Azure SQL vía API .NET: **cumplido**.
- Shell React segmentado por rutas/módulos y servicios desacoplados de React: **cumplido**.
- Manejo de errores global y pruebas base en verde: **cumplido**.
- Monolitos frontend críticos por debajo de umbral operativo:
  - `MapaEcosistemicoPage` aún es grande pero ya modularizado por paneles.
  - `MapaParticipaPage` reducida y con bloque específico externalizado.
- Recomendación: **ya se puede iniciar la migración progresiva a Angular** por verticales (Noticias/Agenda -> Editorial -> Mapa -> Participación), manteniendo backend compartido.
