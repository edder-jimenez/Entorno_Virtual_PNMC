-- PNMC - consultas rapidas de calidad de datos locales.
-- Ejecutar manualmente en VS Code MSSQL, Azure Data Studio o sqlcmd.

-- 1) Duplicated DIVIPOLA combinations
SELECT CodigoDepartamento, CodigoMunicipio, COUNT(*) AS RegistrosDuplicados
FROM dbo.Divipola
GROUP BY CodigoDepartamento, CodigoMunicipio
HAVING COUNT(*) > 1
ORDER BY RegistrosDuplicados DESC;

-- 2) News records without title
SELECT TOP (100) IdNoticia, Titulo, FechaPublicacion
FROM dbo.Noticias
WHERE Titulo IS NULL OR LTRIM(RTRIM(Titulo)) = '';

-- 3) Agenda events without date or territory
SELECT TOP (100) IdAgenda, Titulo, FechaInicio, CodigoDepartamento, CodigoMunicipio
FROM dbo.Agenda
WHERE FechaInicio IS NULL
   OR (NivelCobertura <> N'nacional' AND CodigoDepartamento IS NULL);

-- 4) Territorial records without DIVIPOLA match
SELECT TOP (200)
    f.IdFestival,
    f.NombreFestival,
    f.CodigoDepartamento,
    f.CodigoMunicipio
FROM dbo.Festivales f
LEFT JOIN dbo.Divipola d
    ON d.CodigoDepartamento = f.CodigoDepartamento
   AND d.CodigoMunicipio = f.CodigoMunicipio
WHERE f.CodigoDepartamento IS NOT NULL
  AND d.CodigoDepartamento IS NULL;

-- 5) Registros de participacion con correo potencialmente invalido
SELECT TOP (200) Referencia, CorreoElectronico, FechaEnvio
FROM dbo.Participaciones
WHERE CorreoElectronico IS NULL
   OR CorreoElectronico NOT LIKE '%_@_%._%';
