# CONTROL DE DEUDA TÉCNICA Y PENDIENTES DE REFACTORIZACIÓN

Este sub-documento detalla los aspectos de arquitectura y código que presentan **Deuda Técnica** acumulada en el monorepo del **PNMC** y que deben abordarse en fases de mantenimiento subsiguientes.

---

## 1. REFACTORIZACIÓN CRÍTICA DE `AdminShellPage.jsx`

* **Riesgo Identificado**: El componente `AdminShellPage.jsx` concentra actualmente cerca de **7,800 líneas de código React**. Este archivo agrupa:
  * Paneles de usuarios globales.
  * Consola CMS de edición de textos.
  * Geovisor administrativo.
  * Cola de revisión e histórico de auditoría.
  * Formularios avanzados de edición de registros.
  * Modal de Onboarding de bienvenida (`WelcomeTourModal`).
  * Modal de previsualización de fichas y reclamaciones.
* **Impacto**: Afecta directamente el rendimiento del compilador de Vite en desarrollo, dificulta la legibilidad de código para nuevos desarrolladores y aumenta la probabilidad de introducir regresiones ante cualquier cambio menor.
* **Acción Requerida (Siguiente Sprint)**:
  1. Crear el directorio `pnmc-web/src/features/admin/components`.
  2. Extraer el modal de bienvenida a `WelcomeTourModal.jsx`.
  3. Extraer la lógica de CMS a `AdminCmsPanel.jsx`.
  4. Extraer la cola de revisión ministerial a `RecordReviewModal.jsx` y `AdminQueuePanel.jsx`.
  5. Dejar `AdminShellPage.jsx` únicamente como un orquestador o contenedor estructural fino de layouts y rutas.

---

## 2. SEPARACIÓN TAJANTE DE PORTALES (ALIADOS VS. COLABORADORES)

* **Riesgo Identificado**: En la versión actual de la interfaz de usuario, los Aliados y los Colaboradores Externos comparten ciertas estructuras físicas dentro de la sección `/colaboradores` y cargan condicionalmente elementos del dashboard.
* **Impacto**: Genera confusión visual en el usuario operativo y aumenta la complejidad del ruteo del cliente.
* **Acción Requerida**:
  * Diseñar y segmentar de forma independiente la consola del colaborador autónomo (`/dashboard-externo`) de la consola institucional de los aliados (`/dashboard-aliados`), permitiendo layouts específicos y métricas ad-hoc para cada perfil sin colisiones.

---

## 3. INTEGRACIÓN DE PROVEEDORES REALES (SMTP Y WHATSAPP)

* **Riesgo Identificado**: La cola de notificaciones físicas se persiste de manera óptima en la base de datos local. Sin embargo, el envío de correos reales (como la activación de cuentas o la alerta de ajustes solicitados) está implementado mediante maquetas de pruebas internas o códigos simulados.
* **Impacto**: Limita la automatización y requiere que el gestor contacte manualmente al colaborador si este no inicia sesión.
* **Acción Requerida**:
  * Configurar e integrar un proveedor SMTP transaccional real en la capa de infraestructura del backend de .NET (ej. SendGrid, Amazon SES o Mailgun).
  * Crear plantillas HTML institucionales firmadas digitalmente y configurar un interceptor en EF Core para enviar automáticamente el correo electrónico cada vez que el estado de una ficha cambie.

---

## 4. BITÁCORA ESTRUCTURADA DE LOGS EN EL SERVIDOR

* **Riesgo Identificado**: Los errores del backend se atrapan en middlewares globales y se escriben en la consola estándar del servidor de forma básica.
* **Impacto**: Dificulta el análisis forense de fallos en producción o el rastreo de anomalías de red.
* **Acción Requerida**:
  * Integrar una librería de logging estructurado en el backend de .NET (como **Serilog** o **NLog**).
  * Canalizar la salida de logs en formato JSON estructurado hacia archivos locales rotativos diarios o hacia servicios de telemetría en la nube (como Azure Application Insights o Elasticsearch).
