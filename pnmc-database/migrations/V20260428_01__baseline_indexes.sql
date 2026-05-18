SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Territorial core
IF OBJECT_ID(N'dbo.DivipolaLocations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DivipolaLocations', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.DivipolaLocations', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1
     FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.DivipolaLocations')
       AND name = N'IX_DivipolaLocations_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DivipolaLocations_Department_Municipality
    ON dbo.DivipolaLocations (DepartmentCode ASC, MunicipalityCode ASC);
END;

-- Content modules
IF OBJECT_ID(N'dbo.AgendaEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgendaEvents', N'StartDate') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgendaEvents', N'DepartmentCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.AgendaEvents')
       AND name = N'IX_AgendaEvents_StartDate_DepartmentCode')
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgendaEvents_StartDate_DepartmentCode
    ON dbo.AgendaEvents (StartDate DESC, DepartmentCode ASC);
END;

IF OBJECT_ID(N'dbo.News', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.News', N'PublishedDate') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.News')
       AND name = N'IX_News_PublishedDate')
BEGIN
    CREATE NONCLUSTERED INDEX IX_News_PublishedDate
    ON dbo.News (PublishedDate DESC);
END;

IF OBJECT_ID(N'dbo.EditorialItems', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.EditorialItems', N'Year') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.EditorialItems')
       AND name = N'IX_EditorialItems_Year')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EditorialItems_Year
    ON dbo.EditorialItems ([Year] DESC);
END;

-- Ecosystem map modules
IF OBJECT_ID(N'dbo.Festivals', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Festivals', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.Festivals', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.Festivals')
       AND name = N'IX_Festivals_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Festivals_Department_Municipality
    ON dbo.Festivals (DepartmentCode ASC, MunicipalityCode ASC);
END;

IF OBJECT_ID(N'dbo.MusicSchools', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicSchools', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicSchools', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.MusicSchools')
       AND name = N'IX_MusicSchools_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_MusicSchools_Department_Municipality
    ON dbo.MusicSchools (DepartmentCode ASC, MunicipalityCode ASC);
END;

IF OBJECT_ID(N'dbo.MusicMarkets', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicMarkets', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicMarkets', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.MusicMarkets')
       AND name = N'IX_MusicMarkets_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_MusicMarkets_Department_Municipality
    ON dbo.MusicMarkets (DepartmentCode ASC, MunicipalityCode ASC);
END;

IF OBJECT_ID(N'dbo.Organizations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Organizations', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.Organizations', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.Organizations')
       AND name = N'IX_Organizations_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Organizations_Department_Municipality
    ON dbo.Organizations (DepartmentCode ASC, MunicipalityCode ASC);
END;

IF OBJECT_ID(N'dbo.SpacesInfrastructure', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SpacesInfrastructure', N'DepartmentCode') IS NOT NULL
   AND COL_LENGTH(N'dbo.SpacesInfrastructure', N'MunicipalityCode') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.SpacesInfrastructure')
       AND name = N'IX_SpacesInfrastructure_Department_Municipality')
BEGIN
    CREATE NONCLUSTERED INDEX IX_SpacesInfrastructure_Department_Municipality
    ON dbo.SpacesInfrastructure (DepartmentCode ASC, MunicipalityCode ASC);
END;

-- Participation module
IF OBJECT_ID(N'dbo.ParticipationSubmissions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ParticipationSubmissions', N'SubmittedAt') IS NOT NULL
   AND COL_LENGTH(N'dbo.ParticipationSubmissions', N'Department') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.ParticipationSubmissions')
       AND name = N'IX_ParticipationSubmissions_SubmittedAt_Department')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ParticipationSubmissions_SubmittedAt_Department
    ON dbo.ParticipationSubmissions (SubmittedAt DESC, Department ASC);
END;

COMMIT TRANSACTION;
