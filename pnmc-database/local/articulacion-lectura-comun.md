# Articulacion y lectura comun

Estas tablas no reemplazan las tablas fuente. Funcionan como capa transversal para relacionar, clasificar, resumir y consultar informacion entre modulos.

## RegistrosEcosistema

Indice comun del modulo ecosistemico. Cada fila representa un registro fuente indexado para lectura transversal.

Ejemplos de fuentes:

- `Festivales`
- `EscuelasMusica`
- `MercadosMusicales`
- `RedesDocumentacion`
- `Lutieres`

Reglas:

- Se relaciona con `TiposRegistroEcosistema`.
- La combinacion `IdTipoRegistroEcosistema` + `IdRegistroOrigen` es unica.
- `CodigoDepartamento` + `CodigoMunicipio` referencia `Divipola` cuando el registro es municipal.
- La existencia real de `IdRegistroOrigen` se valida con el trigger `TR_RegistrosEcosistema_ValidarOrigen`.

Nota tecnica:

SQL Server no permite una llave foranea polimorfica hacia varias tablas segun el tipo de registro. Por eso se usa un trigger de integridad. El backend tambien debe validar esta regla antes de insertar o actualizar para entregar errores mas claros al usuario.

## RegistrosEcosistemaTerritoriosSonoros

Relaciona registros ecosistemicos con territorios sonoros.

Reglas:

- Permite multiples territorios por registro.
- Impide duplicados mediante `IdRegistroEcosistema` + `IdTerritorioSonoro`.

## RegistrosEcosistemaPracticasMusicales

Relaciona registros ecosistemicos con practicas musicales.

Reglas:

- Permite multiples practicas por registro.
- Impide duplicados mediante `IdRegistroEcosistema` + `IdPracticaMusical`.

## MetricasDepartamentoMapa

Tabla fisica de metricas agregadas por departamento para alimentar visualizaciones, coropletas y paneles.

Estrategia recomendada:

- Mantenerla como tabla fisica actualizada por el procedimiento `sp_ActualizarMetricasMapa`.
- Ventaja: consultas rapidas para frontend y mapas.
- Desventaja: requiere refrescar la tabla despues de cargas o ediciones relevantes.

Alternativas:

- Vista: siempre actualizada, pero puede ser mas costosa en consultas de mapa.
- Procedimiento sin tabla: flexible, pero menos practico para cachear.
- Vista materializada/indexada: en SQL Server tiene restricciones y no aplica comodamente para todos los agregados.

## MetricasMunicipioMapa

Tabla fisica de metricas agregadas por municipio.

Usa la misma estrategia que `MetricasDepartamentoMapa`: refresco con `sp_ActualizarMetricasMapa`.

## Relaciones de etiquetas y archivos

Tablas puente creadas:

- `AgendaEtiquetas`
- `AgendaArchivos`
- `NoticiasEtiquetas`
- `NoticiasArchivos`
- `AlbumesGaleriaEtiquetas`
- `AlbumesGaleriaArchivos`

Reglas:

- Las relaciones con etiquetas impiden duplicados por entidad + etiqueta.
- Las relaciones con archivos impiden duplicados por entidad + archivo + rol.
- `RolArchivo` permite diferenciar portada, adjunto, foto, documento u otros usos sin crear tablas extra.
