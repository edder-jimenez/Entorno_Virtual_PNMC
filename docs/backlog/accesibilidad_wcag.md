# COMPATIBILIDAD Y ACCESIBILIDAD WEB (WCAG 2.1 AA)

Este sub-documento detalla los estándares de accesibilidad requeridos para garantizar que la plataforma **PNMC** sea completamente usable por personas con diversidad funcional, cumpliendo con la directiva nacional y los estándares internacionales **WCAG 2.1 AA**.

---

## 1. PRINCIPIOS DE ACCESIBILIDAD Y AUDITORÍA REQUERIDA

El objetivo de la plataforma es garantizar los cuatro pilares fundamentales de la accesibilidad digital:

1. **Perceptible**: La información y los componentes de la interfaz deben ser presentados en formas que los usuarios puedan percibir.
2. **Operable**: Los componentes de la interfaz y la navegación deben ser operables por teclado y tecnologías de asistencia.
3. **Comprensible**: La información y el manejo de la interfaz deben ser comprensibles.
4. **Robusto**: El contenido debe ser suficientemente robusto para ser interpretado de forma fiable por una amplia variedad de agentes de usuario, incluyendo lectores de pantalla.

---

## 2. LISTA DE RIESGOS Y ACCIONES DE MITIGACIÓN

### 2.1 Contraste de Colores (Pilar Perceptible)
* **Riesgo**: Algunos paneles del módulo `/admin` presentan textos en tonalidades violetas apagadas sobre fondos slate/oscuros, lo que incumple la relación de contraste mínima de `4.5:1` para texto normal.
* **Acciones de Mitigación**:
  * Ejecutar una auditoría de contraste HSL utilizando herramientas automáticas.
  * Reajustar las clases CSS de colores para asegurar contrastes nítidos y legibles en el tema oscuro del administrador.

### 2.2 Textos Alternativos en Recursos Visuales (Pilar Perceptible)
* **Riesgo**: Ciertas imágenes del carrusel de estrategias y memorias fotográficas de la galería carecen del atributo `alt` descriptivo o cuentan con valores genéricos como `"imagen"`.
* **Acciones de Mitigación**:
  * Realizar un barrido de los componentes React y obligar a que toda imagen inyecte un `alt` semántico descriptivo (ej. `alt="Encuentro nacional de chirimías en el departamento del Cauca"`).
  * Las imágenes meramente decorativas deben contar con un atributo `alt=""` explícito y `role="presentation"` para que los lectores de pantalla las omitan limpiamente.

### 2.3 Trampas de Foco en Pantallas Modales (Pilar Operable)
* **Riesgo**: Al abrir modales interactivos de gran tamaño (como `RecordReviewModal` o `WelcomeTourModal`), el foco de selección de teclado de la tecla `Tab` puede salirse del modal y navegar por elementos ocultos del fondo, confundiendo al usuario invidente.
* **Acciones de Mitigación**:
  * Implementar interceptores de foco (*focus traps*) en los modales para que la tecla `Tab` navegue exclusivamente de forma cíclica dentro de los botones del modal activo.
  * Asegurar que presionar la tecla `Esc` cierre inmediatamente el modal activo y devuelva el foco de selección del teclado exactamente al botón disparador original.

### 2.4 Navegación Teclado en Capa Cartográfica (Pilar Operable)
* **Riesgo**: El geovisor de Leaflet es altamente interactivo con el cursor del mouse, pero los filtros de municipio y los marcadores individuales son de difícil acceso mediante navegación de teclado tradicional.
* **Acciones de Mitigación**:
  * Configurar la propiedad `keyboard={true}` en los marcadores de Leaflet.
  * Inyectar atributos `aria-label` descriptivos a los marcadores geográficos y definir un orden de tabulado (`tabIndex`) coherente para permitir la exploración secuencial del mapa con teclado.

---

## 3. CHECKLIST OPERATIVO DE CONFORMIDAD WCAG 2.1 AA

| Elemento UI | Criterio WCAG | Descripción del Requisito | Estado Actual |
| --- | --- | --- | --- |
| **Formularios de Caracterización** | `1.3.1` (Información y Relaciones) | Todos los campos de entrada tienen un elemento `<label>` asociado de forma explícita mediante el atributo `htmlFor`. | **Cumplido** |
| **Alertas de Validación** | `3.3.1` (Identificación de Errores) | Las validaciones de error se anuncian dinámicamente usando atributos `role="alert"` o `aria-live`. | **Cumplido** |
| **Geovisor Leaflet** | `2.1.1` (Teclado) | Toda la funcionalidad del mapa, zoom, filtros y selección de marcadores es operable por teclado. | *En backlog técnico* |
| **Modales Administrativos** | `2.4.3` (Orden del Foco) | Al abrir un modal, el foco se desplaza dentro de él y se bloquea para evitar escapes (*focus trap*). | *En backlog técnico* |
| **Portal Público General** | `1.4.3` (Contraste Mínimo) | El texto y las imágenes de texto tienen una relación de contraste de al menos `4.5:1` (AA). | *En backlog técnico* |
