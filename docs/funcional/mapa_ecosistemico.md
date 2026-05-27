# CAPA GEOGRÁFICA Y MAPA ECOSISTÉMICO

Este sub-documento detalla las especificaciones funcionales y lógicas del **Mapa Ecosistémico**, el geovisor central que consolida cartográficamente toda la actividad musical del territorio nacional.

---

## 1. COMPONENTES TECNOLÓGICOS Y LIBRERÍAS DE INTEGRACIÓN

El geovisor está desarrollado sobre el frontend en React utilizando:
* **Leaflet**: Motor open-source de cartografía interactiva.
* **React-Leaflet**: Abstracción React para el ciclo de vida del mapa y capas.
* **Leaflet Heatmap (o plugins similares)**: Motor de renderizado dinámico para mapas de calor basados en densidad.
* **Formatos de Entrada**: Coordenadas geográficas estándar EPSG:4326 (Latitud y Longitud WGS84).

---

## 2. CAPAS DE INFORMACIÓN Y VISUALIZACIONES DISPONIBLES

El mapa permite conmutar dinámicamente entre tres modos principales de visualización de acuerdo al interés del usuario:

### 2.1 Marcadores Individuales (Clustering)
* **Funcionalidad**: Dibuja pines específicos para cada proceso cultural catalogado.
* **Alineación Visual**: Cada tipo de registro cuenta con un color representativo único:
  * **Festivales**: Pines de color Púrpura.
  * **Escuelas de Música**: Pines de color Turquesa.
  * **Lutieres**: Pines de color Esmeralda.
  * **Redes de Investigación**: Pines de color Oro.
* **Marker Clustering**: Cuando hay alta densidad en zonas urbanas, Leaflet agrupa automáticamente los pines en círculos con la cuenta total para evitar la saturación visual. Al hacer clic se amplía el zoom (*spiderfy effect*).

### 2.2 Capa de Densidad (Mapa de Calor)
* **Funcionalidad**: Evalúa la densidad de la práctica musical agregada. No expone pines específicos, sino halos de calor concéntricos difuminados (desde verde/azul para baja densidad, hasta rojo/amarillo para zonas calientes).
* **Propósito**: Permitir que los tomadores de decisiones evalúen visualmente qué regiones de Colombia tienen una sólida masa crítica musical y cuáles requieren mayor fomento del plan.

### 2.3 Capa de Coropletas (Densidad Departamental)
* **Funcionalidad**: Colorea de manera homogénea la silueta geográfica de cada departamento.
* **Lógica Dinámica**: Se cruza el número de registros verificados contra un mapa GeoJSON de departamentos de Colombia. La paleta de colores varía la saturación de manera proporcional a la cantidad de escuelas y festivales activos (a mayor número de registros aprobados, más intensa es la coloración).

---

## 3. INTEGRACIÓN CON EL SISTEMA DIVIPOLA

Para garantizar la homogeneidad con las bases de datos de la Registraduría y del DANE de Colombia, el sistema de búsqueda sincroniza sus consultas en base al catálogo **DIVIPOLA (División Político-Administrativa)**.

* **Filtros Sincronizados**: El geovisor expone desplegables de "Departamento" y "Municipio". Al seleccionar un departamento, el mapa ejecuta una transición animada (*flyTo*) hacia su centroide y carga dinámicamente los municipios de ese territorio.
* **Consistencia de Consulta**: Las escuelas en la base de datos se catalogan mediante el código de municipio DIVIPOLA de 5 dígitos (ej. `15238` para Duitama), lo que asegura cruces geográficos 100% fiables sin errores por acentos o grafías diferentes.

---

## 4. REGISTRO Y ARRASTRE DE COORDENADAS (DRAG & DROP)

Para simplificar la carga de coordenadas geográficas por parte de los Colaboradores Externos que no conocen su latitud y longitud:
* **Mapa de Ubicación Interactivo**: Durante el wizard de caracterización, la plataforma despliega un mapa Leaflet centrado en el municipio seleccionado.
* **Pin de Marcación**: El usuario puede hacer clic en cualquier punto físico o arrastrar el marcador (*draggable marker*) directamente a su sede física.
* **Captura de Coordenadas**: El formulario lee en tiempo real el evento `dragend` de Leaflet y autocompleta con precisión decimal los inputs numéricos de Latitud y Longitud, evitando que el usuario deba transcribirlos manualmente de otras aplicaciones.
