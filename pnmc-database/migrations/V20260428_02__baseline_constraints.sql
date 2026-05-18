SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1) Unique reference for participation submissions
IF OBJECT_ID(N'dbo.ParticipationSubmissions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ParticipationSubmissions', N'Reference') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.indexes
     WHERE object_id = OBJECT_ID(N'dbo.ParticipationSubmissions')
       AND name = N'UX_ParticipationSubmissions_Reference')
BEGIN
    IF NOT EXISTS (
        SELECT Reference
        FROM dbo.ParticipationSubmissions
        GROUP BY Reference
        HAVING COUNT(*) > 1
    )
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UX_ParticipationSubmissions_Reference
        ON dbo.ParticipationSubmissions (Reference ASC);
    END;
END;

-- 2) News title required (only if no invalid rows already exist)
IF OBJECT_ID(N'dbo.News', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.News', N'Title') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.News')
       AND name = N'CK_News_Title_NotBlank')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.News
        WHERE Title IS NULL OR LTRIM(RTRIM(Title)) = ''
    )
    BEGIN
        ALTER TABLE dbo.News
        ADD CONSTRAINT CK_News_Title_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Title))) > 0);
    END;
END;

-- 3) Agenda title required
IF OBJECT_ID(N'dbo.AgendaEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgendaEvents', N'Title') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.AgendaEvents')
       AND name = N'CK_AgendaEvents_Title_NotBlank')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.AgendaEvents
        WHERE Title IS NULL OR LTRIM(RTRIM(Title)) = ''
    )
    BEGIN
        ALTER TABLE dbo.AgendaEvents
        ADD CONSTRAINT CK_AgendaEvents_Title_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Title))) > 0);
    END;
END;

-- 4) Festival name required
IF OBJECT_ID(N'dbo.Festivals', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Festivals', N'Name') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.Festivals')
       AND name = N'CK_Festivals_Name_NotBlank')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Festivals
        WHERE Name IS NULL OR LTRIM(RTRIM(Name)) = ''
    )
    BEGIN
        ALTER TABLE dbo.Festivals
        ADD CONSTRAINT CK_Festivals_Name_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Name))) > 0);
    END;
END;

-- 5) School name required
IF OBJECT_ID(N'dbo.MusicSchools', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicSchools', N'Name') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.MusicSchools')
       AND name = N'CK_MusicSchools_Name_NotBlank')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.MusicSchools
        WHERE Name IS NULL OR LTRIM(RTRIM(Name)) = ''
    )
    BEGIN
        ALTER TABLE dbo.MusicSchools
        ADD CONSTRAINT CK_MusicSchools_Name_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Name))) > 0);
    END;
END;

-- 6) Market name required
IF OBJECT_ID(N'dbo.MusicMarkets', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.MusicMarkets', N'Name') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.MusicMarkets')
       AND name = N'CK_MusicMarkets_Name_NotBlank')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.MusicMarkets
        WHERE Name IS NULL OR LTRIM(RTRIM(Name)) = ''
    )
    BEGIN
        ALTER TABLE dbo.MusicMarkets
        ADD CONSTRAINT CK_MusicMarkets_Name_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Name))) > 0);
    END;
END;

COMMIT TRANSACTION;
