# Bases maestras estaticas

Estas tablas son catalogos de referencia para la reconstruccion local de la base PNMC. No incluyen estados, auditoria ni campos de actividad porque su contenido debe cambiar muy poco.

## Divipola

Base territorial oficial de referencia. Guarda una fila por municipio o area no municipalizada.

Campos:

- `CodigoDepartamento`: codigo oficial de departamento, dos digitos.
- `NombreDepartamento`: nombre oficial del departamento.
- `CodigoMunicipio`: codigo oficial DIVIPOLA completo, cinco digitos.
- `NombreMunicipio`: nombre oficial del municipio o area no municipalizada.
- `TipoTerritorio`: tipo de territorio reportado por la fuente.
- `Latitud` y `Longitud`: punto aproximado calculado desde la geometria local para usos de referencia.

Reglas:

- No tiene ID artificial.
- Llave primaria: `CodigoDepartamento` + `CodigoMunicipio`.
- `CodigoMunicipio` es unico.
- `CodigoMunicipio` debe empezar por `CodigoDepartamento`.
- Indices para filtros por departamento y busquedas por nombre.

## TerritoriosSonoros

Catalogo maestro de territorios sonoros. Sirve como base para relaciones posteriores con procesos, contenidos, recursos o registros ecosistemicos.

Valores iniciales:

- Cantos, Pitos y Tambores
- Canta y Torbellino
- Rajalena y Cucamba
- Marimba
- Flautas, Cuerdas y Tambores Surenos
- Chirimia
- Joropo
- Trova y Parranda
- Amazonas
- Insular
- Practicas de Pueblos Indigenas
- Musicas Urbanas, Alternativas e Independientes - MUAI
- Comunidades Academicas
- Rrom

Reglas:

- `IdTerritorioSonoro` es llave primaria tecnica.
- `NombreTerritorioSonoro` es unico.
- `Slug` es unico.
- `OrdenVisualizacion` debe ser mayor que cero.

## PracticasMusicales

Catalogo maestro de generos, practicas musicales y practicas sonoras. Sirve para clasificar procesos, recursos editoriales, contenidos y relaciones futuras.

Valores iniciales:

- Expresiones sonoras de pueblos originarios
- Musicas de comunidades negras, afrocolombianas, raizales y palenqueras
- Musicas campesinas, rurales y de raiz territorial
- Musicas populares tradicionales, regionales y patrimoniales
- Musicas comunitarias y procesos colectivos de practica musical
- Musicas de frontera, diasporas, migraciones e interculturalidad
- Musicas urbanas, alternativas e independientes
- Musicas populares de amplia circulacion, tropicales, bailables y comerciales
- Musicas vocales, corales y de tradicion cantada
- Musicas sinfonicas, bandas, orquestas y grandes formatos instrumentales
- Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento
- Musicas academicas, de camara, contemporaneas, experimentales y de vanguardia
- Musicas electronicas, digitales, produccion sonora y nuevas tecnologias
- Musicas religiosas, rituales, espirituales y devocionales
- Musicas para escena, danza, audiovisual e interdisciplinariedad
- Practicas sonoras, arte sonoro, archivo, investigacion-creacion y paisajes sonoros

Reglas:

- `IdPracticaMusical` es llave primaria tecnica.
- `NombrePracticaMusical` es unico.
- `Slug` es unico.
- `OrdenVisualizacion` debe ser mayor que cero.

## TiposRegistroEcosistema

Catalogo maestro para definir que tipo de registro sera indexado luego en la capa de articulacion ecosistemica.

Valores iniciales:

- `festival`
- `escuela_musica`
- `mercado_musical`
- `red_documentacion`
- `lutier`

Reglas:

- `IdTipoRegistroEcosistema` es llave primaria tecnica.
- `CodigoTipoRegistro` es unico, en minusculas y sin espacios.
- `NombreTipoRegistro` es unico.
