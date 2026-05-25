/*
    PNMC - Datos iniciales de bases maestras estaticas.
    Este archivo no incluye Divipola; Divipola se genera desde el TopoJSON oficial local.
*/

DELETE FROM dbo.TerritoriosSonoros;
DBCC CHECKIDENT ('dbo.TerritoriosSonoros', RESEED, 0);

INSERT INTO dbo.TerritoriosSonoros
    (NombreTerritorioSonoro, Slug, Descripcion, OrdenVisualizacion)
VALUES
    (N'Cantos, Pitos y Tambores', N'cantos-pitos-y-tambores', NULL, 1),
    (N'Canta y Torbellino', N'canta-y-torbellino', NULL, 2),
    (N'Rajaleña y Cucamba', N'rajalena-y-cucamba', NULL, 3),
    (N'Marimba', N'marimba', NULL, 4),
    (N'Flautas, Cuerdas y Tambores Sureños', N'flautas-cuerdas-y-tambores-surenos', NULL, 5),
    (N'Chirimía', N'chirimia', NULL, 6),
    (N'Joropo', N'joropo', NULL, 7),
    (N'Trova y Parranda', N'trova-y-parranda', NULL, 8),
    (N'Amazonas', N'amazonas', NULL, 9),
    (N'Insular', N'insular', NULL, 10),
    (N'Prácticas de Pueblos Indígenas', N'practicas-de-pueblos-indigenas', NULL, 11),
    (N'Músicas Urbanas, Alternativas e Independientes - MUAI', N'muai', NULL, 12),
    (N'Comunidades Académicas', N'comunidades-academicas', NULL, 13),
    (N'Rrom', N'rrom', NULL, 14);

DELETE FROM dbo.PracticasMusicales;
DBCC CHECKIDENT ('dbo.PracticasMusicales', RESEED, 0);

INSERT INTO dbo.PracticasMusicales
    (NombrePracticaMusical, Slug, Descripcion, OrdenVisualizacion)
VALUES
    (N'Expresiones sonoras de pueblos originarios', N'expresiones-sonoras-de-pueblos-originarios', NULL, 1),
    (N'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras', N'musicas-de-comunidades-negras-afrocolombianas-raizales-y-palenqueras', NULL, 2),
    (N'Músicas campesinas, rurales y de raíz territorial', N'musicas-campesinas-rurales-y-de-raiz-territorial', NULL, 3),
    (N'Músicas populares tradicionales, regionales y patrimoniales', N'musicas-populares-tradicionales-regionales-y-patrimoniales', NULL, 4),
    (N'Músicas comunitarias y procesos colectivos de práctica musical', N'musicas-comunitarias-y-procesos-colectivos-de-practica-musical', NULL, 5),
    (N'Músicas de frontera, diásporas, migraciones e interculturalidad', N'musicas-de-frontera-diasporas-migraciones-e-interculturalidad', NULL, 6),
    (N'Músicas urbanas, alternativas e independientes', N'musicas-urbanas-alternativas-e-independientes', NULL, 7),
    (N'Músicas populares de amplia circulación, tropicales, bailables y comerciales', N'musicas-populares-de-amplia-circulacion-tropicales-bailables-y-comerciales', NULL, 8),
    (N'Músicas vocales, corales y de tradición cantada', N'musicas-vocales-corales-y-de-tradicion-cantada', NULL, 9),
    (N'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales', N'musicas-sinfonicas-bandas-orquestas-y-grandes-formatos-instrumentales', NULL, 10),
    (N'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento', N'bandas-de-marcha-batucadas-comparsas-y-colectivos-sonoros-en-movimiento', NULL, 11),
    (N'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia', N'musicas-academicas-de-camara-contemporaneas-experimentales-y-de-vanguardia', NULL, 12),
    (N'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías', N'musicas-electronicas-digitales-produccion-sonora-y-nuevas-tecnologias', NULL, 13),
    (N'Músicas religiosas, rituales, espirituales y devocionales', N'musicas-religiosas-rituales-espirituales-y-devocionales', NULL, 14),
    (N'Músicas para escena, danza, audiovisual e interdisciplinariedad', N'musicas-para-escena-danza-audiovisual-e-interdisciplinariedad', NULL, 15),
    (N'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros', N'practicas-sonoras-arte-sonoro-archivo-investigacion-creacion-y-paisajes-sonoros', NULL, 16);

MERGE dbo.TiposRegistroEcosistema AS destino
USING (VALUES
    (N'festival', N'Festival', N'Registro de festival musical o sonoro.'),
    (N'escuela_musica', N'Escuela de musica', N'Registro de escuela, proceso o espacio de formacion musical.'),
    (N'mercado_musical', N'Mercado musical', N'Registro de mercado, rueda, plataforma o encuentro profesional del sector musical.'),
    (N'red_documentacion', N'Red de documentacion', N'Registro de red, archivo, centro o proceso de documentacion musical y sonora.'),
    (N'lutier', N'Lutier', N'Registro de persona, taller o proceso asociado a construccion, reparacion o investigacion de instrumentos.')
) AS origen (CodigoTipoRegistro, NombreTipoRegistro, Descripcion)
ON destino.CodigoTipoRegistro = origen.CodigoTipoRegistro
WHEN MATCHED THEN
    UPDATE SET
        NombreTipoRegistro = origen.NombreTipoRegistro,
        Descripcion = origen.Descripcion
WHEN NOT MATCHED THEN
    INSERT (CodigoTipoRegistro, NombreTipoRegistro, Descripcion)
    VALUES (origen.CodigoTipoRegistro, origen.NombreTipoRegistro, origen.Descripcion);
