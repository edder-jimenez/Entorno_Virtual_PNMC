# MOTOR DE RECLAMACIÓN Y FLUJO DE ESTADOS DE VINCULACIÓN

Este sub-documento de gobernanza detalla el funcionamiento del **Motor de Reclamación Territorial**, diseñado para que los directores y gestores culturales asuman la propiedad de los miles de registros históricos "huérfanos" existentes en la base de datos nacional, evitando la duplicación de datos.

---

## 1. EL CONCEPTO DE "REGISTROS HUÉRFANOS"

El Plan Nacional de Música para la Convivencia (PNMC) cuenta con una rica base de datos con miles de marcadores georreferenciados recolectados por el Ministerio en censos y mapeos anteriores (2018-2024).

Muchos de estos registros están publicados en el geovisor, pero carecen de una cuenta de usuario que se haga responsable de mantenerlos actualizados. A estos registros se les denomina **Registros Huérfanos**.

Para evitar que los nuevos usuarios creen fichas duplicadas desde cero (lo que saturaría el mapa y rompería la consistencia histórica del proceso), la plataforma implementa el **Sistema de Reclamación Territorial**.

---

## 2. FLUJO COMPLETO DEL PROCESO DE RECLAMACIÓN (DE PRINCIPIO A FIN)

```
 [ Auto-Registro del Colaborador ] ──► [ Confirmar Correo ] ──► [ Wizard de Caracterización (DIVIPOLA) ]
                                                                                  │
                                                                                  ▼
 [ Borrador en Panel Personal ] ◄── [ RECLAMAR / VINCULAR ] ◄── [ Escaneo e Identificación de Coincidencias (3s) ]
               │
               ▼
 [ Enviar a Cola de Revisión ] ──► [ Evaluación Ministerial ] ──► [ Vinculación Aprobada e Información Publicada ]
```

### 2.1 Fase 1: Caracterización y Selección Territorial
1. El gestor de la escuela de música crea una cuenta básica en la plataforma.
2. Al ingresar, completa el wizard de caracterización en 3 pasos. En el **Paso 3 (Territorio)**, selecciona su departamento y municipio (siguiendo el estándar geográfico **DIVIPOLA** de Colombia).

### 2.2 Fase 2: Disparo del Motor de Escaneo Geográfico
1. Al enviar la caracterización, la interfaz del frontend bloquea temporalmente las acciones y despliega un componente interactivo de carga durante **3 segundos**.
2. **Animación y Spinner**: Esta pantalla simula una auditoría inteligente en segundo plano mostrando el spinner y una barra de progreso que anuncia: *"Cruzando información territorial para identificar coincidencias históricas..."*.
3. **Consulta de Base de Datos**: El backend realiza una búsqueda física de registros en ese municipio que cumplan con la condición de ser **Registros Huérfanos** (es decir, campo `UsuarioCreadorId IS NULL` o `EstadoVinculacionId == 'sin_responsable'`).

### 2.3 Fase 3: La Bandeja de Coincidencias y Reclamaciones Históricas
1. Tras los 3 segundos, el sistema expone los resultados en una lista titulada **"Bandeja de Coincidencias y Reclamaciones Históricas"**.
2. **Previsualización de Metadatos del Censo**: El usuario puede hacer clic en **"Previsualizar"** para abrir un modal detallado. Este modal le expone los datos históricos almacenados: el nombre del antiguo director, cantidad de alumnos en 2019, especialidades originales y teléfonos obsoletos.
3. **Acciones**:
   * **Ignorar**: Si el registro no corresponde a su proceso, presiona "Ignorar" para ocultarlo de su panel sin alterar su disponibilidad para otros gestores de la región.
   * **Reclamar / Vincular**: Si confirma que es su proceso cultural, presiona el botón. El sistema despacha una petición al endpoint administrativo de vinculación `/api/vinculaciones/reclamar`.

### 2.4 Fase 4: Clonación en Caliente y Estado Editorial Borrador
1. Al reclamar, el backend asocia el `UsuarioCreadorId = Usuario.Id` del colaborador externo.
2. El registro cambia su estado de vinculación a `reclamacion_en_revision` y **se incorpora inmediatamente al panel de "Mis Procesos Culturales" del colaborador en estado editorial de Borrador (`borrador`)**.
3. El registro desaparece inmediatamente de la bandeja de coincidencias municipal para evitar que otros usuarios lo reclamen en paralelo.

### 2.5 Fase 5: Edición y Reenvío Ministerial
1. El colaborador ahora tiene el control editorial total de la ficha de su escuela o festival.
2. Presiona **"Editar"** en su panel personal. Puede reescribir toda la información obsoleta: colocar el nombre de contacto vigente, corregir coordenadas geográficas arrastrando un marcador en el mapa Leaflet, y adjuntar fotos recientes.
3. Una vez actualizado, el colaborador presiona **"Enviar a Revisión"**, cambiando su estado editorial a `en_revision`.

### 2.6 Fase 6: Moderación y Publicación Definitiva
1. El **Gestor Interno** recibe el registro y la solicitud en su consola `/admin`.
2. Inspecciona los cambios y aprueba la solicitud.
3. El estado de vinculación pasa formalmente a `vinculacion_aprobada` (propiedad permanente asignada al gestor comunitario) y el estado editorial pasa a `publicado` (visible de forma definitiva en el geovisor público).

---

## 3. LÍNEAS DE ESTADO: EDITORIAL VS. VINCULACIÓN

La plataforma define con rigor dos líneas de estado independientes para evitar colisiones:

### 3.1 Estado Editorial (Ciclo de Publicación y Moderación)
Representa la calidad y validez técnica de la información del registro.
* `borrador`: Creado recientemente o reclamado en edición. No es visible al público.
* `en_revision`: Enviado por el colaborador. Está en la cola de revisión ministerial.
* `ajustes_solicitados`: El moderador del Ministerio encontró campos erróneos y requiere corrección por el colaborador.
* `aprobado`: Aprobado técnicamente.
* `publicado`: Visible de manera pública para toda la ciudadanía en el mapa y buscadores.
* `rechazado`: Descartado administrativamente.
* `archivado`: Histórico retirado de la web.

### 3.2 Estado de Vinculación / Reclamación (Ciclo de Propiedad)
Representa la asignación y responsabilidad jurídica de la información.
* `sin responsable asignado (huérfano)`: El registro existe históricamente pero no tiene un colaborador dueño.
* `posible coincidencia`: Detectado de forma heurística durante el escaneo municipal.
* `reclamación en revisión`: El colaborador externo ha solicitado la vinculación; requiere aprobación del gestor interno.
* `vinculación aprobada`: Propiedad asignada exitosamente al colaborador.
