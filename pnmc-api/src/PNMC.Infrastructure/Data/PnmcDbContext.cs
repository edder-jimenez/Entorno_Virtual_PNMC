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

    public DbSet<EditorialItemRow> EditorialItems => Set<EditorialItemRow>();
    public DbSet<EditorialClassificationRow> EditorialClassifications => Set<EditorialClassificationRow>();
    public DbSet<EditorialBibliographicRecordRow> EditorialBibliographicRecords => Set<EditorialBibliographicRecordRow>();
    public DbSet<EditorialAvailabilityRow> EditorialAvailabilities => Set<EditorialAvailabilityRow>();
    public DbSet<EditorialFileRow> EditorialFiles => Set<EditorialFileRow>();
    public DbSet<FileRow> Files => Set<FileRow>();

    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<RoleRow> Roles => Set<RoleRow>();

    public DbSet<ParticipationSubmissionRow> ParticipationSubmissions => Set<ParticipationSubmissionRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CategoryRow>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ContentStatusRow>(entity =>
        {
            entity.ToTable("ContentStatuses");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<DivipolaLocationRow>(entity =>
        {
            entity.ToTable("DivipolaLocations");
            entity.HasKey(x => new { x.DepartmentCode, x.MunicipalityCode });
        });

        modelBuilder.Entity<AgendaEventRow>(entity =>
        {
            entity.ToTable("AgendaEvents");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<NewsArticleRow>(entity =>
        {
            entity.ToTable("News");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<NewsMediaRow>(entity =>
        {
            entity.ToTable("NewsMedia");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<NewsTagRow>(entity =>
        {
            entity.ToTable("NewsTags");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<TagRow>(entity =>
        {
            entity.ToTable("Tags");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<FestivalRow>(entity =>
        {
            entity.ToTable("Festivals");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<SchoolRow>(entity =>
        {
            entity.ToTable("MusicSchools");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<MarketRow>(entity =>
        {
            entity.ToTable("MusicMarkets");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<OrganizationRow>(entity =>
        {
            entity.ToTable("Organizations");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<SpaceInfrastructureRow>(entity =>
        {
            entity.ToTable("SpacesInfrastructure");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ProcessEntityRelationRow>(entity =>
        {
            entity.ToTable("ProcessEntityRelations");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ProcessRelationRow>(entity =>
        {
            entity.ToTable("ProcessRelations");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<EditorialItemRow>(entity =>
        {
            entity.ToTable("EditorialItems");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<EditorialClassificationRow>(entity =>
        {
            entity.ToTable("EditorialClassifications");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<EditorialBibliographicRecordRow>(entity =>
        {
            entity.ToTable("EditorialBibliographicRecords");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<EditorialAvailabilityRow>(entity =>
        {
            entity.ToTable("EditorialAvailability");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<EditorialFileRow>(entity =>
        {
            entity.ToTable("EditorialFiles");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<FileRow>(entity =>
        {
            entity.ToTable("Files");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<UserRow>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<RoleRow>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ParticipationSubmissionRow>(entity =>
        {
            entity.ToTable("ParticipationSubmissions");
            entity.HasKey(x => x.Reference);
            entity.Property(x => x.Reference).HasMaxLength(64);
            entity.Property(x => x.ActorType).HasMaxLength(80);
            entity.Property(x => x.ActorName).HasMaxLength(240);
            entity.Property(x => x.Email).HasMaxLength(240);
            entity.Property(x => x.Department).HasMaxLength(120);
            entity.Property(x => x.Municipality).HasMaxLength(120);
            entity.HasIndex(x => x.SubmittedAt);
            entity.HasIndex(x => x.ActorType);
            entity.HasIndex(x => x.Department);
        });
    }
}
