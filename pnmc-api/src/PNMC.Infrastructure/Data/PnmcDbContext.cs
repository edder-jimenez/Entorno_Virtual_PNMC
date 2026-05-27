using Microsoft.EntityFrameworkCore;

namespace PNMC.Infrastructure.Data;

public sealed class PnmcDbContext : DbContext
{
    public PnmcDbContext(DbContextOptions<PnmcDbContext> options)
        : base(options)
    {
    }

    public DbSet<CategoryRow> Categories => Set<CategoryRow>();
    public DbSet<ContentStatusRow> ContentStatuses => Set<ContentStatusRow>();
    public DbSet<DivipolaLocationRow> DivipolaLocations => Set<DivipolaLocationRow>();

    public DbSet<AgendaEventRow> AgendaEvents => Set<AgendaEventRow>();
    public DbSet<NewsArticleRow> NewsArticles => Set<NewsArticleRow>();
    public DbSet<NewsMediaRow> NewsMedia => Set<NewsMediaRow>();
    public DbSet<NewsTagRow> NewsTags => Set<NewsTagRow>();
    public DbSet<TagRow> Tags => Set<TagRow>();

    public DbSet<FestivalRow> FestivalRecords => Set<FestivalRow>();
    public DbSet<SchoolRow> SchoolRecords => Set<SchoolRow>();
    public DbSet<MarketRow> MarketRecords => Set<MarketRow>();
    public DbSet<OrganizationRow> Organizations => Set<OrganizationRow>();
    public DbSet<SpaceInfrastructureRow> SpacesInfrastructure => Set<SpaceInfrastructureRow>();
    public DbSet<ProcessEntityRelationRow> ProcessEntityRelations => Set<ProcessEntityRelationRow>();
    public DbSet<ProcessRelationRow> ProcessRelations => Set<ProcessRelationRow>();

    public DbSet<GalleryAlbumRow> GalleryAlbums => Set<GalleryAlbumRow>();
    public DbSet<GalleryAlbumFileRow> GalleryAlbumFiles => Set<GalleryAlbumFileRow>();
    public DbSet<EditorialCatalogResourceRow> EditorialCatalogResources => Set<EditorialCatalogResourceRow>();
    public DbSet<FileRow> Files => Set<FileRow>();

    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<RoleRow> Roles => Set<RoleRow>();
    public DbSet<AuditLogRow> AuditLogs => Set<AuditLogRow>();
    public DbSet<UserVerificationCodeRow> UserVerificationCodes => Set<UserVerificationCodeRow>();
    public DbSet<AllyEntityRow> AllyEntities => Set<AllyEntityRow>();
    public DbSet<AllyUserLinkRow> AllyUserLinks => Set<AllyUserLinkRow>();
    public DbSet<AllyRequestRow> AllyRequests => Set<AllyRequestRow>();
    public DbSet<NotificationRow> Notifications => Set<NotificationRow>();
    public DbSet<RecordLinkRequestRow> RecordLinkRequests => Set<RecordLinkRequestRow>();
    public DbSet<RecordDuplicateCandidateRow> RecordDuplicateCandidates => Set<RecordDuplicateCandidateRow>();
    public DbSet<RecordQualityFlagRow> RecordQualityFlags => Set<RecordQualityFlagRow>();
    public DbSet<EntityProfileRow> EntityProfiles => Set<EntityProfileRow>();
    public DbSet<UserEntityRow> UserEntities => Set<UserEntityRow>();
    public DbSet<EntityRelationRow> EntityRelations => Set<EntityRelationRow>();
    public DbSet<EntitySourceRecordRow> EntitySourceRecords => Set<EntitySourceRecordRow>();
    public DbSet<EntityReviewHistoryRow> EntityReviewHistory => Set<EntityReviewHistoryRow>();

    public DbSet<ParticipationSubmissionRow> Participations => Set<ParticipationSubmissionRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CategoryRow>(entity =>
        {
            entity.ToTable("Categorias");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdCategoria");
            entity.Property(x => x.ModuleCode).HasColumnName("CodigoModulo");
            entity.Property(x => x.Name).HasColumnName("NombreCategoria");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
            entity.Ignore(x => x.ParentCategoryId);
            entity.Ignore(x => x.IsActive);
        });

        modelBuilder.Entity<ContentStatusRow>(entity =>
        {
            entity.ToTable("EstadosContenido");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEstadoContenido");
            entity.Property(x => x.Code).HasColumnName("CodigoEstado");
            entity.Property(x => x.Name).HasColumnName("NombreEstado");
            entity.Property(x => x.Description).HasColumnName("DescripcionEstado");
        });

        modelBuilder.Entity<DivipolaLocationRow>(entity =>
        {
            entity.ToTable("Divipola");
            entity.HasKey(x => new { x.DepartmentCode, x.MunicipalityCode });
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.DepartmentName).HasColumnName("NombreDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.MunicipalityName).HasColumnName("NombreMunicipio");
            entity.Property(x => x.LocationType).HasColumnName("TipoTerritorio");
            entity.Property(x => x.Latitude).HasColumnName("Latitud");
            entity.Property(x => x.Longitude).HasColumnName("Longitud");
            entity.Property(x => x.Latitude).HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<AgendaEventRow>(entity =>
        {
            entity.ToTable("Agenda");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdAgenda");
            entity.Property(x => x.Title).HasColumnName("Titulo");
            entity.Property(x => x.Description).HasColumnName("DescripcionLarga");
            entity.Property(x => x.CategoryId).HasColumnName("IdCategoria");
            entity.Property(x => x.StartDate).HasColumnName("FechaInicio");
            entity.Property(x => x.EndDate).HasColumnName("FechaFin");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.SpecificLocation).HasColumnName("LugarEspecifico");
            entity.Property(x => x.OrganizationName).HasColumnName("Organizador");
            entity.Property(x => x.MoreInfoUrl).HasColumnName("UrlMasInformacion");
            entity.Property(x => x.StatusId).HasColumnName("IdEstadoContenido");
            entity.Property(x => x.CreatedByUserId).HasColumnName("IdUsuarioCreador");
            entity.Property(x => x.ReviewedByUserId).HasColumnName("IdUsuarioRevisor");
            entity.Property(x => x.ApprovedByUserId).HasColumnName("IdUsuarioAprobador");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.PublishedAt).HasColumnName("FechaPublicacion");
            entity.Property(x => x.ArchivedAt).HasColumnName("FechaArchivo");
            entity.Property(x => x.ShortDescription).HasColumnName("DescripcionCorta");
            entity.Property(x => x.StartTime).HasColumnName("HoraInicio");
            entity.Property(x => x.EndTime).HasColumnName("HoraFin");
            entity.Property(x => x.FestivalId).HasColumnName("IdFestival");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
        });

        modelBuilder.Entity<NewsArticleRow>(entity =>
        {
            entity.ToTable("Noticias");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdNoticia");
            entity.Property(x => x.Title).HasColumnName("Titulo");
            entity.Property(x => x.Lead).HasColumnName("Entradilla");
            entity.Property(x => x.Body).HasColumnName("Cuerpo");
            entity.Property(x => x.QuoteText).HasColumnName("CitaDestacada");
            entity.Property(x => x.SlugPrimary).HasColumnName("Slug");
            entity.Property(x => x.AuthorName).HasColumnName("Autor");
            entity.Property(x => x.CategoryId).HasColumnName("IdCategoria");
            entity.Property(x => x.PublishedDate).HasColumnName("FechaPublicacion");
            entity.Property(x => x.PrimaryExternalUrl).HasColumnName("UrlExterna");
            entity.Property(x => x.PrimaryEmbedUrl).HasColumnName("UrlEmbed");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
            entity.Property(x => x.StatusId).HasColumnName("IdEstadoContenido");
            entity.Property(x => x.CreatedByUserId).HasColumnName("IdUsuarioCreador");
            entity.Property(x => x.ReviewedByUserId).HasColumnName("IdUsuarioRevisor");
            entity.Property(x => x.ApprovedByUserId).HasColumnName("IdUsuarioAprobador");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.ArchivedAt).HasColumnName("FechaArchivo");
            entity.Ignore(x => x.SlugSecondary);
            entity.Ignore(x => x.SlugTertiary);
            entity.Ignore(x => x.UpdatedDate);
            entity.Ignore(x => x.PublishedAt);
        });

        modelBuilder.Entity<NewsMediaRow>(entity =>
        {
            entity.ToTable("NoticiasArchivos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdNoticiaArchivo");
            entity.Property(x => x.NewsId).HasColumnName("IdNoticia");
            entity.Property(x => x.FileId).HasColumnName("IdArchivo");
            entity.Property(x => x.MediaType).HasColumnName("RolArchivo");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
            entity.Ignore(x => x.ExternalUrl);
            entity.Ignore(x => x.Caption);
            entity.Ignore(x => x.Credit);
            entity.Ignore(x => x.IsPrimary);
        });

        modelBuilder.Entity<NewsTagRow>(entity =>
        {
            entity.ToTable("NoticiasEtiquetas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdNoticiaEtiqueta");
            entity.Property(x => x.NewsId).HasColumnName("IdNoticia");
            entity.Property(x => x.TagId).HasColumnName("IdEtiqueta");
        });

        modelBuilder.Entity<TagRow>(entity =>
        {
            entity.ToTable("Etiquetas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEtiqueta");
            entity.Property(x => x.Name).HasColumnName("NombreEtiqueta");
        });

        modelBuilder.Entity<FestivalRow>(entity =>
        {
            entity.ToTable("Festivales");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdFestival");
            entity.Property(x => x.Name).HasColumnName("NombreFestival");
            entity.Property(x => x.VersionsCount).HasColumnName("NumeroVersiones");
            entity.Property(x => x.LastEditionDate).HasColumnName("FechaUltimaVersion");
            entity.Property(x => x.Description).HasColumnName("Descripcion");
            entity.Property(x => x.OrganizerDisplayName).HasColumnName("Organizador");
            entity.Property(x => x.OrganizerContactEmail).HasColumnName("CorreoOrganizador");
            entity.Property(x => x.OrganizerContactPhone).HasColumnName("TelefonoOrganizador");
            entity.Property(x => x.OrganizerWebsiteUrl).HasColumnName("SitioWebOrganizador");
            entity.Property(x => x.ContactEmail).HasColumnName("CorreoFestival");
            entity.Property(x => x.InstagramUrl).HasColumnName("InstagramFestival");
            entity.Property(x => x.FacebookUrl).HasColumnName("FacebookFestival");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWebFestival");
            entity.Property(x => x.OtherUrl).HasColumnName("OtroEnlaceFestival");
            entity.Property(x => x.ContactPhone).HasColumnName("TelefonoFestival");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.HasCurrentYearEdition).HasColumnName("TieneVersionVigenteAnoActual");
            entity.Property(x => x.CurrentYearEditionStatus).HasColumnName("EstadoVersionAnoActual");
            entity.Property(x => x.CurrentYearStartDate).HasColumnName("FechaInicioVersionActual");
            entity.Property(x => x.CurrentYearEndDate).HasColumnName("FechaFinVersionActual");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Ignore(x => x.HasRegisteredOrganizer);
            entity.Ignore(x => x.SpecificLocation);
            entity.Ignore(x => x.StatusId);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.ReviewedByUserId);
            entity.Ignore(x => x.ApprovedByUserId);
            entity.Ignore(x => x.PublishedAt);
            entity.Ignore(x => x.ArchivedAt);
        });

        modelBuilder.Entity<SchoolRow>(entity =>
        {
            entity.ToTable("EscuelasMusica");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEscuelaMusica");
            entity.Property(x => x.Name).HasColumnName("NombreEscuela");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.SpecificLocation).HasColumnName("LugarEspecifico");
            entity.Property(x => x.AddressText).HasColumnName("Direccion");
            entity.Property(x => x.Latitude).HasColumnName("Latitud");
            entity.Property(x => x.Longitude).HasColumnName("Longitud");
            entity.Property(x => x.SchoolCategory).HasColumnName("CategoriaEscuela");
            entity.Property(x => x.SchoolType).HasColumnName("TipoEscuela");
            entity.Property(x => x.ResponsibleEntityDisplayName).HasColumnName("EntidadResponsable");
            entity.Property(x => x.DirectorName).HasColumnName("NombreDirector");
            entity.Property(x => x.ContactEmail).HasColumnName("CorreoContacto");
            entity.Property(x => x.ContactPhone).HasColumnName("TelefonoContacto");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWeb");
            entity.Property(x => x.InstagramUrl).HasColumnName("Instagram");
            entity.Property(x => x.FacebookUrl).HasColumnName("Facebook");
            entity.Property(x => x.OtherUrl).HasColumnName("OtroEnlace");
            entity.Property(x => x.TrainingProcesses).HasColumnName("ProcesosFormativos");
            entity.Property(x => x.MusicalPractices).HasColumnName("PracticasMusicales");
            entity.Property(x => x.ActiveGroupsCount).HasColumnName("CantidadGruposActivos");
            entity.Property(x => x.StudentsAgeTotal).HasColumnName("CapacidadFormativa");
            entity.Property(x => x.StudentsTotal).HasColumnName("CantidadEstudiantes");
            entity.Property(x => x.IsActiveSchool).HasColumnName("EscuelaActiva");
            entity.Property(x => x.Observations).HasColumnName("Observaciones");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Ignore(x => x.HasRegisteredResponsibleEntity);
            entity.Ignore(x => x.HasCommunityOrganization);
            entity.Ignore(x => x.CommunityOrganizationName);
            entity.Ignore(x => x.CommunityOrganizationContact);
            entity.Ignore(x => x.CommunityOrganizationPhone);
            entity.Ignore(x => x.CommunityOrganizationEmail);
            entity.Ignore(x => x.StatusId);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.ReviewedByUserId);
            entity.Ignore(x => x.ApprovedByUserId);
            entity.Ignore(x => x.PublishedAt);
            entity.Ignore(x => x.ArchivedAt);
            entity.Property(x => x.Latitude).HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<MarketRow>(entity =>
        {
            entity.ToTable("MercadosMusicales");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdMercadoMusical");
            entity.Property(x => x.Name).HasColumnName("NombreMercado");
            entity.Property(x => x.EditionsCount).HasColumnName("NumeroEdiciones");
            entity.Property(x => x.Periodicity).HasColumnName("Periodicidad");
            entity.Property(x => x.Description).HasColumnName("Descripcion");
            entity.Property(x => x.HasCurrentYearEdition).HasColumnName("TieneEdicionVigenteAnoActual");
            entity.Property(x => x.CurrentYearEditionStatus).HasColumnName("EstadoEdicionAnoActual");
            entity.Property(x => x.CurrentYearStartDate).HasColumnName("FechaInicioEdicionActual");
            entity.Property(x => x.CurrentYearEndDate).HasColumnName("FechaFinEdicionActual");
            entity.Property(x => x.ResponsibleEntityDisplayName).HasColumnName("EntidadResponsable");
            entity.Property(x => x.ResponsibleEntityContactEmail).HasColumnName("CorreoEntidadResponsable");
            entity.Property(x => x.ResponsibleEntityContactPhone).HasColumnName("TelefonoEntidadResponsable");
            entity.Property(x => x.ResponsibleEntityWebsiteUrl).HasColumnName("SitioWebEntidadResponsable");
            entity.Property(x => x.AssociatedFestivalDisplayName).HasColumnName("NombreFestivalAsociado");
            entity.Property(x => x.AssociatedFestivalId).HasColumnName("IdFestivalAsociado");
            entity.Property(x => x.ScopeType).HasColumnName("Alcance");
            entity.Property(x => x.MarketMode).HasColumnName("Modalidad");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.SpecificLocation).HasColumnName("LugarEspecifico");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Ignore(x => x.HasRegisteredResponsibleEntity);
            entity.Ignore(x => x.HasAssociatedFestival);
            entity.Ignore(x => x.StatusId);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.ReviewedByUserId);
            entity.Ignore(x => x.ApprovedByUserId);
            entity.Ignore(x => x.PublishedAt);
            entity.Ignore(x => x.ArchivedAt);
        });

        modelBuilder.Entity<OrganizationRow>(entity =>
        {
            entity.ToTable("RedesDocumentacion");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRedDocumentacion");
            entity.Property(x => x.Name).HasColumnName("Nombre");
            entity.Property(x => x.ContactEmail).HasColumnName("CorreoContacto");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.TerritorialScope).HasColumnName("Zona");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWeb");
            entity.Property(x => x.FacebookUrl).HasColumnName("Facebook");
            entity.Property(x => x.InstagramUrl).HasColumnName("Instagram");
            entity.Property(x => x.OtherUrl).HasColumnName("OtroEnlace");
            entity.Property(x => x.OrganizationType).HasColumnName("TipoCentro");
            entity.Property(x => x.Latitude).HasColumnName("Latitud");
            entity.Property(x => x.Longitude).HasColumnName("Longitud");
            entity.Property(x => x.Description).HasColumnName("Descripcion");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Ignore(x => x.SocialReason);
            entity.Ignore(x => x.LegalName);
            entity.Ignore(x => x.ContactPersonName);
            entity.Ignore(x => x.ContactPersonRole);
            entity.Ignore(x => x.ContactPhone);
            entity.Ignore(x => x.CreationYear);
            entity.Ignore(x => x.MusicalPractices);
            entity.Ignore(x => x.PrimaryFunction);
            entity.Ignore(x => x.SecondaryFunctions);
            entity.Ignore(x => x.OtherPrimaryFunction);
            entity.Ignore(x => x.StatusId);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.ReviewedByUserId);
            entity.Ignore(x => x.ApprovedByUserId);
            entity.Ignore(x => x.PublishedAt);
            entity.Ignore(x => x.ArchivedAt);
            entity.Property(x => x.Latitude).HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<SpaceInfrastructureRow>(entity =>
        {
            entity.ToTable("Lutieres");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdLutier");
            entity.Property(x => x.Name).HasColumnName("NombreTaller");
            entity.Property(x => x.ResponsibleEntityDisplayName).HasColumnName("Nombre");
            entity.Property(x => x.ContactPersonName).HasColumnName("NombreContacto");
            entity.Property(x => x.ContactEmail).HasColumnName("CorreoContacto");
            entity.Property(x => x.ContactPhone).HasColumnName("TelefonoContacto");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.SpecificLocation).HasColumnName("Zona");
            entity.Property(x => x.AddressText).HasColumnName("Direccion");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWeb");
            entity.Property(x => x.FacebookUrl).HasColumnName("Facebook");
            entity.Property(x => x.InstagramUrl).HasColumnName("Instagram");
            entity.Property(x => x.OtherUrl).HasColumnName("OtroEnlace");
            entity.Property(x => x.PrimaryFunction).HasColumnName("Especialidad");
            entity.Property(x => x.SecondaryFunctions).HasColumnName("Instrumentos");
            entity.Property(x => x.ActorType).HasColumnName("TipoLutier");
            entity.Property(x => x.MainUses).HasColumnName("Descripcion");
            entity.Property(x => x.Latitude).HasColumnName("Latitud");
            entity.Property(x => x.Longitude).HasColumnName("Longitud");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Ignore(x => x.HasRegisteredResponsibleEntity);
            entity.Ignore(x => x.ContactPersonRole);
            entity.Ignore(x => x.OtherPrimaryFunction);
            entity.Ignore(x => x.MaxCapacityApprox);
            entity.Ignore(x => x.MusicalPractices);
            entity.Ignore(x => x.StatusId);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.ReviewedByUserId);
            entity.Ignore(x => x.ApprovedByUserId);
            entity.Ignore(x => x.PublishedAt);
            entity.Ignore(x => x.ArchivedAt);
            entity.Property(x => x.Latitude).HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<ProcessEntityRelationRow>(entity =>
        {
            entity.ToTable("RegistrosEcosistemaTerritoriosSonoros");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRelacionTerritorioSonoro");
            entity.Property(x => x.ProcessId).HasColumnName("IdRegistroEcosistema");
            entity.Property(x => x.EntityId).HasColumnName("IdTerritorioSonoro");
            entity.Ignore(x => x.ProcessType);
            entity.Ignore(x => x.EntityType);
            entity.Ignore(x => x.RelationshipType);
            entity.Ignore(x => x.Notes);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.CreatedAt);
        });

        modelBuilder.Entity<ProcessRelationRow>(entity =>
        {
            entity.ToTable("RegistrosEcosistema");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRegistroEcosistema");
            entity.Property(x => x.SourceProcessId).HasColumnName("IdRegistroOrigen");
            entity.Property(x => x.TargetProcessId).HasColumnName("IdTipoRegistroEcosistema");
            entity.Ignore(x => x.SourceProcessType);
            entity.Ignore(x => x.TargetProcessType);
            entity.Ignore(x => x.RelationshipType);
            entity.Ignore(x => x.Notes);
            entity.Ignore(x => x.CreatedByUserId);
            entity.Ignore(x => x.CreatedAt);
        });

        modelBuilder.Entity<GalleryAlbumRow>(entity =>
        {
            entity.ToTable("AlbumesGaleria");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdAlbum");
            entity.Property(x => x.Title).HasColumnName("TituloAlbum");
            entity.Property(x => x.Description).HasColumnName("DescripcionAlbum");
            entity.Property(x => x.CategoryId).HasColumnName("IdCategoria");
            entity.Property(x => x.StatusId).HasColumnName("IdEstadoContenido");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
            entity.Property(x => x.CreatedByUserId).HasColumnName("IdUsuarioCreador");
            entity.Property(x => x.ReviewedByUserId).HasColumnName("IdUsuarioRevisor");
            entity.Property(x => x.ApprovedByUserId).HasColumnName("IdUsuarioAprobador");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.PublishedAt).HasColumnName("FechaPublicacion");
            entity.Property(x => x.ArchivedAt).HasColumnName("FechaArchivo");
        });

        modelBuilder.Entity<GalleryAlbumFileRow>(entity =>
        {
            entity.ToTable("AlbumesGaleriaArchivos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdAlbumGaleriaArchivo");
            entity.Property(x => x.AlbumId).HasColumnName("IdAlbum");
            entity.Property(x => x.FileId).HasColumnName("IdArchivo");
            entity.Property(x => x.FileRole).HasColumnName("RolArchivo");
            entity.Property(x => x.SortOrder).HasColumnName("OrdenVisualizacion");
        });

        modelBuilder.Entity<EditorialCatalogResourceRow>(entity =>
        {
            entity.ToTable("CatalogoEditorial");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRecursoEditorial");
            entity.Property(x => x.ExternalId).HasColumnName("CodigoRecurso");
            entity.Property(x => x.Title).HasColumnName("Titulo");
            entity.Property(x => x.Year).HasColumnName("Anio");
            entity.Property(x => x.Section).HasColumnName("SeccionPrincipal");
            entity.Property(x => x.SectionPath).HasColumnName("RutaSeccion");
            entity.Property(x => x.PublicationType).HasColumnName("TipoPublicacion");
            entity.Property(x => x.Practice).HasColumnName("PracticaMusical");
            entity.Property(x => x.Category).HasColumnName("Categoria");
            entity.Property(x => x.Subcategory).HasColumnName("Subcategoria");
            entity.Property(x => x.Author).HasColumnName("Autor");
            entity.Property(x => x.CorporateAuthor).HasColumnName("AutorCorporativo");
            entity.Property(x => x.Credits).HasColumnName("CreditosAdicionales");
            entity.Property(x => x.Isbn).HasColumnName("ISBN");
            entity.Property(x => x.Ismn).HasColumnName("ISMN");
            entity.Property(x => x.FormatSize).HasColumnName("TamanoFormato");
            entity.Property(x => x.Pages).HasColumnName("Paginas");
            entity.Property(x => x.Duration).HasColumnName("Duracion");
            entity.Property(x => x.RegionalScope).HasColumnName("AmbitoRegional");
            entity.Property(x => x.Location).HasColumnName("UbicacionPublicacion");
            entity.Property(x => x.Url).HasColumnName("Url");
            entity.Property(x => x.Keywords).HasColumnName("PalabrasClave");
            entity.Property(x => x.Summary).HasColumnName("Resumen");
            entity.Property(x => x.AdditionalFields).HasColumnName("CamposAdicionales");
            entity.Property(x => x.SourceSlide).HasColumnName("DiapositivaOrigen");
            entity.Property(x => x.ThumbnailPath).HasColumnName("ArchivoMiniatura");
            entity.Property(x => x.CoverText).HasColumnName("TextoPortada");
            entity.Property(x => x.SourceText).HasColumnName("TextoFuenteCompleto");
            entity.Property(x => x.SourceOrder).HasColumnName("OrdenFuente");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.ImportedAt).HasColumnName("FechaImportacion");
        });

        modelBuilder.Entity<FileRow>(entity =>
        {
            entity.ToTable("Archivos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdArchivo");
            entity.Property(x => x.OriginalName).HasColumnName("NombreOriginal");
            entity.Property(x => x.StoredName).HasColumnName("NombreAlmacenado");
            entity.Property(x => x.MimeType).HasColumnName("TipoMime");
            entity.Property(x => x.FileSizeBytes).HasColumnName("PesoBytes");
            entity.Property(x => x.StoragePath).HasColumnName("RutaAlmacenamiento");
            entity.Property(x => x.PublicUrl).HasColumnName("UrlPublica");
            entity.Property(x => x.AltText).HasColumnName("TextoAlternativo");
            entity.Property(x => x.Caption).HasColumnName("Pie");
            entity.Property(x => x.Credit).HasColumnName("Credito");
            entity.Property(x => x.UploadedByUserId).HasColumnName("IdUsuarioCarga");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCarga");
        });

        modelBuilder.Entity<UserRow>(entity =>
        {
            entity.ToTable("Usuarios");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdUsuario");
            entity.Property(x => x.FullName).HasColumnName("NombreCompleto");
            entity.Property(x => x.Email).HasColumnName("CorreoElectronico");
            entity.Property(x => x.PasswordHash).HasColumnName("HashContrasena");
            entity.Property(x => x.RoleId).HasColumnName("IdRol");
            entity.Property(x => x.AccessChannel).HasColumnName("CanalAcceso");
            entity.Property(x => x.ProfileType).HasColumnName("TipoPerfil");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.LastLoginAt).HasColumnName("UltimoAcceso");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<RoleRow>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRol");
            entity.Property(x => x.Name).HasColumnName("NombreRol");
            entity.Property(x => x.Description).HasColumnName("DescripcionRol");
        });

        modelBuilder.Entity<AuditLogRow>(entity =>
        {
            entity.ToTable("BitacoraAuditoria");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdAuditoria");
            entity.Property(x => x.UserId).HasColumnName("IdUsuario");
            entity.Property(x => x.TableName).HasColumnName("TablaAfectada");
            entity.Property(x => x.RecordId).HasColumnName("IdRegistroAfectado");
            entity.Property(x => x.Action).HasColumnName("Accion");
            entity.Property(x => x.PreviousValuesJson).HasColumnName("ValoresAnteriores");
            entity.Property(x => x.NewValuesJson).HasColumnName("ValoresNuevos");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaAccion");
        });

        modelBuilder.Entity<UserVerificationCodeRow>(entity =>
        {
            entity.ToTable("UsuariosCodigosVerificacion");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdUsuarioCodigoVerificacion");
            entity.Property(x => x.UserId).HasColumnName("IdUsuario");
            entity.Property(x => x.Purpose).HasColumnName("Proposito");
            entity.Property(x => x.Code).HasColumnName("Codigo");
            entity.Property(x => x.ExpiresAt).HasColumnName("FechaExpiracion");
            entity.Property(x => x.ConsumedAt).HasColumnName("FechaConsumo");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
        });

        modelBuilder.Entity<AllyEntityRow>(entity =>
        {
            entity.ToTable("EntidadesAliadas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEntidadAliada");
            entity.Property(x => x.Name).HasColumnName("Nombre");
            entity.Property(x => x.EntityType).HasColumnName("TipoEntidad");
            entity.Property(x => x.Nit).HasColumnName("Nit");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.InstitutionalEmail).HasColumnName("CorreoInstitucional");
            entity.Property(x => x.InstitutionalPhone).HasColumnName("TelefonoInstitucional");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWeb");
            entity.Property(x => x.LogoUrl).HasColumnName("LogoUrl");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.CreatedByUserId).HasColumnName("CreadaPorUsuarioId");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<AllyUserLinkRow>(entity =>
        {
            entity.ToTable("UsuariosEntidadesAliadas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdUsuarioEntidadAliada");
            entity.Property(x => x.UserId).HasColumnName("UsuarioId");
            entity.Property(x => x.AllyEntityId).HasColumnName("EntidadAliadaId");
            entity.Property(x => x.AllyRole).HasColumnName("RolAliado");
            entity.Property(x => x.AllyAdminId).HasColumnName("AliadoAdminId");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.LinkedAt).HasColumnName("FechaVinculacion");
            entity.Property(x => x.CreatedByUserId).HasColumnName("CreadoPorUsuarioId");
        });

        modelBuilder.Entity<AllyRequestRow>(entity =>
        {
            entity.ToTable("SolicitudesAliado");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdSolicitudAliado");
            entity.Property(x => x.EntityName).HasColumnName("NombreEntidad");
            entity.Property(x => x.EntityType).HasColumnName("TipoEntidad");
            entity.Property(x => x.Nit).HasColumnName("Nit");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.InstitutionalEmail).HasColumnName("CorreoInstitucional");
            entity.Property(x => x.InstitutionalPhone).HasColumnName("TelefonoInstitucional");
            entity.Property(x => x.AdminName).HasColumnName("NombreAdministrador");
            entity.Property(x => x.AdminEmail).HasColumnName("CorreoAdministrador");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.ReviewComment).HasColumnName("ComentarioRevision");
            entity.Property(x => x.ReviewerUserId).HasColumnName("UsuarioRevisorId");
            entity.Property(x => x.AllyEntityId).HasColumnName("EntidadAliadaId");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<NotificationRow>(entity =>
        {
            entity.ToTable("Notificaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdNotificacion");
            entity.Property(x => x.RecipientUserId).HasColumnName("UsuarioDestinatarioId");
            entity.Property(x => x.RecipientEmail).HasColumnName("CorreoDestinatario");
            entity.Property(x => x.EventType).HasColumnName("TipoEvento");
            entity.Property(x => x.Channel).HasColumnName("Canal");
            entity.Property(x => x.Title).HasColumnName("Titulo");
            entity.Property(x => x.Body).HasColumnName("Cuerpo");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.ModuleId).HasColumnName("ModuloId");
            entity.Property(x => x.RecordId).HasColumnName("RegistroId");
            entity.Property(x => x.MetadataJson).HasColumnName("MetadataJson");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.SentAt).HasColumnName("FechaEnvio");
            entity.Property(x => x.ReadAt).HasColumnName("FechaLectura");
            entity.Property(x => x.Attempts).HasColumnName("Intentos");
            entity.Property(x => x.Error).HasColumnName("Error");
        });

        modelBuilder.Entity<RecordLinkRequestRow>(entity =>
        {
            entity.ToTable("SolicitudesVinculacionRegistros");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdSolicitudVinculacionRegistro");
            entity.Property(x => x.ModuleId).HasColumnName("ModuloId");
            entity.Property(x => x.RecordId).HasColumnName("RegistroId");
            entity.Property(x => x.RequestingUserId).HasColumnName("UsuarioSolicitanteId");
            entity.Property(x => x.AllyEntityId).HasColumnName("EntidadAliadaId");
            entity.Property(x => x.RequestedScope).HasColumnName("AlcanceSolicitado");
            entity.Property(x => x.Reason).HasColumnName("Justificacion");
            entity.Property(x => x.EvidenceText).HasColumnName("EvidenciaTexto");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.ReviewerUserId).HasColumnName("UsuarioRevisorId");
            entity.Property(x => x.ReviewComment).HasColumnName("ComentarioRevision");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<RecordDuplicateCandidateRow>(entity =>
        {
            entity.ToTable("RegistrosDuplicadosCandidatos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdDuplicadoCandidato");
            entity.Property(x => x.ModuleId).HasColumnName("ModuloId");
            entity.Property(x => x.SourceRecordId).HasColumnName("RegistroOrigenId");
            entity.Property(x => x.CandidateRecordId).HasColumnName("RegistroCandidatoId");
            entity.Property(x => x.SimilarityLevel).HasColumnName("NivelCoincidencia");
            entity.Property(x => x.SimilarityScore).HasColumnName("PuntajeCoincidencia").HasPrecision(5, 2);
            entity.Property(x => x.EvidenceJson).HasColumnName("EvidenciaJson");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.Decision).HasColumnName("Decision");
            entity.Property(x => x.DecisionComment).HasColumnName("ComentarioDecision");
            entity.Property(x => x.ReviewerUserId).HasColumnName("UsuarioRevisorId");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<RecordQualityFlagRow>(entity =>
        {
            entity.ToTable("RegistrosCalidadDatos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdRegistroCalidadDatos");
            entity.Property(x => x.ModuleId).HasColumnName("ModuloId");
            entity.Property(x => x.RecordId).HasColumnName("RegistroId");
            entity.Property(x => x.FlagType).HasColumnName("TipoBandera");
            entity.Property(x => x.Severity).HasColumnName("Severidad");
            entity.Property(x => x.Status).HasColumnName("Estado");
            entity.Property(x => x.Detail).HasColumnName("Detalle");
            entity.Property(x => x.CreatedByUserId).HasColumnName("CreadoPorUsuarioId");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
        });

        modelBuilder.Entity<EntityProfileRow>(entity =>
        {
            entity.ToTable("Entidades");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEntidad");
            entity.Property(x => x.EntityType).HasColumnName("TipoEntidad");
            entity.Property(x => x.Name).HasColumnName("Nombre");
            entity.Property(x => x.LegalName).HasColumnName("NombreLegal");
            entity.Property(x => x.Description).HasColumnName("Descripcion");
            entity.Property(x => x.ContactEmail).HasColumnName("CorreoContacto");
            entity.Property(x => x.ContactPhone).HasColumnName("TelefonoContacto");
            entity.Property(x => x.WebsiteUrl).HasColumnName("SitioWeb");
            entity.Property(x => x.FacebookUrl).HasColumnName("Facebook");
            entity.Property(x => x.InstagramUrl).HasColumnName("Instagram");
            entity.Property(x => x.OtherUrl).HasColumnName("OtroEnlace");
            entity.Property(x => x.CoverageLevel).HasColumnName("NivelCobertura");
            entity.Property(x => x.DepartmentCode).HasColumnName("CodigoDepartamento");
            entity.Property(x => x.MunicipalityCode).HasColumnName("CodigoMunicipio");
            entity.Property(x => x.AddressText).HasColumnName("Direccion");
            entity.Property(x => x.Latitude).HasColumnName("Latitud").HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasColumnName("Longitud").HasPrecision(9, 6);
            entity.Property(x => x.StatusCode).HasColumnName("EstadoRegistro");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.CreatedByUserId).HasColumnName("IdUsuarioCreador");
            entity.Property(x => x.ResponsibleUserId).HasColumnName("IdUsuarioResponsable");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
            entity.Property(x => x.UpdatedAt).HasColumnName("FechaActualizacion");
            entity.Property(x => x.ReviewedAt).HasColumnName("FechaRevision");
            entity.Property(x => x.ApprovedAt).HasColumnName("FechaAprobacion");
            entity.Property(x => x.PublishedAt).HasColumnName("FechaPublicacion");
        });

        modelBuilder.Entity<UserEntityRow>(entity =>
        {
            entity.ToTable("UsuariosEntidades");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdUsuarioEntidad");
            entity.Property(x => x.UserId).HasColumnName("IdUsuario");
            entity.Property(x => x.EntityId).HasColumnName("IdEntidad");
            entity.Property(x => x.EntityRole).HasColumnName("RolEntidad");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
        });

        modelBuilder.Entity<EntityRelationRow>(entity =>
        {
            entity.ToTable("EntidadesRelaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEntidadRelacion");
            entity.Property(x => x.SourceEntityId).HasColumnName("IdEntidadOrigen");
            entity.Property(x => x.TargetEntityId).HasColumnName("IdEntidadDestino");
            entity.Property(x => x.RelationshipType).HasColumnName("TipoRelacion");
            entity.Property(x => x.Notes).HasColumnName("Notas");
            entity.Property(x => x.IsActive).HasColumnName("Activo");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
        });

        modelBuilder.Entity<EntitySourceRecordRow>(entity =>
        {
            entity.ToTable("EntidadesRegistrosFuente");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdEntidadRegistroFuente");
            entity.Property(x => x.EntityId).HasColumnName("IdEntidad");
            entity.Property(x => x.SourceTable).HasColumnName("TablaFuente");
            entity.Property(x => x.SourceRecordId).HasColumnName("IdRegistroFuente");
            entity.Property(x => x.EcosystemRecordId).HasColumnName("IdRegistroEcosistema");
            entity.Property(x => x.IsPrimary).HasColumnName("EsPrincipal");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaCreacion");
        });

        modelBuilder.Entity<EntityReviewHistoryRow>(entity =>
        {
            entity.ToTable("EntidadesHistorialRevision");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("IdHistorialRevision");
            entity.Property(x => x.EntityId).HasColumnName("IdEntidad");
            entity.Property(x => x.UserId).HasColumnName("IdUsuario");
            entity.Property(x => x.Action).HasColumnName("Accion");
            entity.Property(x => x.Comment).HasColumnName("Comentario");
            entity.Property(x => x.CreatedAt).HasColumnName("FechaAccion");
        });

        modelBuilder.Entity<ParticipationSubmissionRow>(entity =>
        {
            entity.ToTable("Participaciones");
            entity.HasKey(x => x.Reference);
            entity.Property(x => x.Reference).HasColumnName("Referencia").HasMaxLength(64);
            entity.Property(x => x.SubmittedAt).HasColumnName("FechaEnvio");
            entity.Property(x => x.ActorType).HasColumnName("TipoActor").HasMaxLength(80);
            entity.Property(x => x.ActorName).HasColumnName("NombreActor").HasMaxLength(240);
            entity.Property(x => x.Email).HasColumnName("CorreoElectronico").HasMaxLength(240);
            entity.Property(x => x.Department).HasColumnName("Departamento").HasMaxLength(120);
            entity.Property(x => x.Municipality).HasColumnName("Municipio").HasMaxLength(120);
            entity.Property(x => x.PayloadJson).HasColumnName("DatosFormularioJson");
            entity.HasIndex(x => x.SubmittedAt);
            entity.HasIndex(x => x.ActorType);
            entity.HasIndex(x => x.Department);
        });
    }
}
