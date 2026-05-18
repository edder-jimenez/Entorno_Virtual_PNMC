-- PNMC data quality quick audit queries
-- Run manually in Azure SQL Query Editor or SSMS.

-- 1) Duplicated DIVIPOLA combinations
SELECT DepartmentCode, MunicipalityCode, COUNT(*) AS DuplicateCount
FROM dbo.DivipolaLocations
GROUP BY DepartmentCode, MunicipalityCode
HAVING COUNT(*) > 1
ORDER BY DuplicateCount DESC;

-- 2) News records without title
SELECT TOP (100) Id, Title, PublishedDate
FROM dbo.News
WHERE Title IS NULL OR LTRIM(RTRIM(Title)) = '';

-- 3) Agenda events without date or territory
SELECT TOP (100) Id, Title, StartDate, DepartmentCode, MunicipalityCode
FROM dbo.AgendaEvents
WHERE StartDate IS NULL OR DepartmentCode IS NULL;

-- 4) Territorial records without DIVIPOLA match
SELECT TOP (200)
    f.Id,
    f.Name,
    f.DepartmentCode,
    f.MunicipalityCode
FROM dbo.Festivals f
LEFT JOIN dbo.DivipolaLocations d
    ON d.DepartmentCode = f.DepartmentCode
   AND d.MunicipalityCode = f.MunicipalityCode
WHERE d.DepartmentCode IS NULL;

-- 5) Participation submissions with potentially invalid email format
SELECT TOP (200) Reference, Email, SubmittedAt
FROM dbo.ParticipationSubmissions
WHERE Email IS NULL
   OR Email NOT LIKE '%_@_%._%';
