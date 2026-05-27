namespace PNMC.Domain.Entities;

public sealed class CategoryRow
{
    public int Id { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public sealed class ContentStatusRow
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public sealed class DivipolaLocationRow
{
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string MunicipalityCode { get; set; } = string.Empty;
    public string MunicipalityName { get; set; } = string.Empty;
    public string? LocationType { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? Latitude { get; set; }
}

public sealed class AgendaEventRow
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? SpecificLocation { get; set; }
    public string? OrganizationName { get; set; }
    public string? MoreInfoUrl { get; set; }
    public int StatusId { get; set; }
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public string? ShortDescription { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public int? FestivalId { get; set; }
    public int? SortOrder { get; set; }
}

public sealed class NewsArticleRow
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Lead { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? QuoteText { get; set; }
    public string SlugPrimary { get; set; } = string.Empty;
    public string? SlugSecondary { get; set; }
    public string? SlugTertiary { get; set; }
    public string? AuthorName { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? PublishedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string? PrimaryExternalUrl { get; set; }
    public string? PrimaryEmbedUrl { get; set; }
    public int? SortOrder { get; set; }
    public int StatusId { get; set; }
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class NewsMediaRow
{
    public int Id { get; set; }
    public int NewsId { get; set; }
    public int? FileId { get; set; }
    public string MediaType { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public string? Caption { get; set; }
    public string? Credit { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public sealed class NewsTagRow
{
    public int Id { get; set; }
    public int NewsId { get; set; }
    public int TagId { get; set; }
}

public sealed class TagRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public sealed class FestivalRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? VersionsCount { get; set; }
    public DateTime? LastEditionDate { get; set; }
    public string? Description { get; set; }
    public string? OrganizerDisplayName { get; set; }
    public string? OrganizerContactEmail { get; set; }
    public string? OrganizerContactPhone { get; set; }
    public string? OrganizerWebsiteUrl { get; set; }
    public bool HasRegisteredOrganizer { get; set; }
    public string? ContactEmail { get; set; }
    public string? InstagramUrl { get; set; }
    public string? FacebookUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? OtherUrl { get; set; }
    public string? ContactPhone { get; set; }
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? SpecificLocation { get; set; }
    public int StatusId { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public bool HasCurrentYearEdition { get; set; }
    public string? CurrentYearEditionStatus { get; set; }
    public DateTime? CurrentYearStartDate { get; set; }
    public DateTime? CurrentYearEndDate { get; set; }
}

public sealed class SchoolRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? SpecificLocation { get; set; }
    public string? AddressText { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? SchoolCategory { get; set; }
    public string? SchoolType { get; set; }
    public string? ResponsibleEntityDisplayName { get; set; }
    public bool HasRegisteredResponsibleEntity { get; set; }
    public string? DirectorName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? FacebookUrl { get; set; }
    public string? OtherUrl { get; set; }
    public bool HasCommunityOrganization { get; set; }
    public string? CommunityOrganizationName { get; set; }
    public string? CommunityOrganizationContact { get; set; }
    public string? CommunityOrganizationPhone { get; set; }
    public string? CommunityOrganizationEmail { get; set; }
    public string? TrainingProcesses { get; set; }
    public string? MusicalPractices { get; set; }
    public int? ActiveGroupsCount { get; set; }
    public int? StudentsAgeTotal { get; set; }
    public int? StudentsTotal { get; set; }
    public bool IsActiveSchool { get; set; }
    public string? Observations { get; set; }
    public int StatusId { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class MarketRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? EditionsCount { get; set; }
    public string? Periodicity { get; set; }
    public string? Description { get; set; }
    public bool HasCurrentYearEdition { get; set; }
    public string? CurrentYearEditionStatus { get; set; }
    public DateTime? CurrentYearStartDate { get; set; }
    public DateTime? CurrentYearEndDate { get; set; }
    public string? ResponsibleEntityDisplayName { get; set; }
    public string? ResponsibleEntityContactEmail { get; set; }
    public string? ResponsibleEntityContactPhone { get; set; }
    public string? ResponsibleEntityWebsiteUrl { get; set; }
    public bool HasRegisteredResponsibleEntity { get; set; }
    public string? AssociatedFestivalDisplayName { get; set; }
    public int? AssociatedFestivalId { get; set; }
    public bool HasAssociatedFestival { get; set; }
    public string? ScopeType { get; set; }
    public string? MarketMode { get; set; }
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? SpecificLocation { get; set; }
    public int StatusId { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class OrganizationRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SocialReason { get; set; }
    public string? LegalName { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? TerritorialScope { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? OtherUrl { get; set; }
    public string? OrganizationType { get; set; }
    public short? CreationYear { get; set; }
    public string? MusicalPractices { get; set; }
    public string? PrimaryFunction { get; set; }
    public string? SecondaryFunctions { get; set; }
    public string? OtherPrimaryFunction { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }
    public int StatusId { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class SpaceInfrastructureRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ResponsibleEntityDisplayName { get; set; }
    public bool HasRegisteredResponsibleEntity { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonRole { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string CoverageLevel { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string? MunicipalityCode { get; set; }
    public string? SpecificLocation { get; set; }
    public string? AddressText { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? OtherUrl { get; set; }
    public string? PrimaryFunction { get; set; }
    public string? SecondaryFunctions { get; set; }
    public string? OtherPrimaryFunction { get; set; }
    public string? ActorType { get; set; }
    public int? MaxCapacityApprox { get; set; }
    public string? MusicalPractices { get; set; }
    public string? MainUses { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int StatusId { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class ProcessEntityRelationRow
{
    public int Id { get; set; }
    public string ProcessType { get; set; } = string.Empty;
    public int ProcessId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ProcessRelationRow
{
    public int Id { get; set; }
    public string SourceProcessType { get; set; } = string.Empty;
    public int SourceProcessId { get; set; }
    public string TargetProcessType { get; set; } = string.Empty;
    public int TargetProcessId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class GalleryAlbumRow
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public int StatusId { get; set; }
    public int SortOrder { get; set; }
    public int CreatedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public int? ApprovedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
}

public sealed class GalleryAlbumFileRow
{
    public int Id { get; set; }
    public int AlbumId { get; set; }
    public int FileId { get; set; }
    public string FileRole { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public sealed class EditorialCatalogResourceRow
{
    public int Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Year { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string SectionPath { get; set; } = string.Empty;
    public string PublicationType { get; set; } = string.Empty;
    public string Practice { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Subcategory { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string CorporateAuthor { get; set; } = string.Empty;
    public string Credits { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;
    public string Ismn { get; set; } = string.Empty;
    public string FormatSize { get; set; } = string.Empty;
    public string Pages { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string RegionalScope { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string AdditionalFields { get; set; } = string.Empty;
    public string SourceSlide { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public string CoverText { get; set; } = string.Empty;
    public string SourceText { get; set; } = string.Empty;
    public int SourceOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime ImportedAt { get; set; }
}

public sealed class FileRow
{
    public int Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? Extension { get; set; }
    public long? FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Credit { get; set; }
    public int UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class UserRow
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string AccessChannel { get; set; } = "interno";
    public string? ProfileType { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class RoleRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public sealed class AuditLogRow
{
    public long Id { get; set; }
    public int? UserId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? PreviousValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class UserVerificationCodeRow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AllyEntityRow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? Nit { get; set; }
    public string? DepartmentCode { get; set; }
    public string? MunicipalityCode { get; set; }
    public string? InstitutionalEmail { get; set; }
    public string? InstitutionalPhone { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string Status { get; set; } = "pendiente";
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class AllyUserLinkRow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int AllyEntityId { get; set; }
    public string AllyRole { get; set; } = string.Empty;
    public int? AllyAdminId { get; set; }
    public string Status { get; set; } = "activo";
    public bool IsActive { get; set; } = true;
    public DateTime LinkedAt { get; set; }
    public int? CreatedByUserId { get; set; }
}

public sealed class AllyRequestRow
{
    public long Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? Nit { get; set; }
    public string? DepartmentCode { get; set; }
    public string? MunicipalityCode { get; set; }
    public string InstitutionalEmail { get; set; } = string.Empty;
    public string? InstitutionalPhone { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "pendiente";
    public string? ReviewComment { get; set; }
    public int? ReviewerUserId { get; set; }
    public int? AllyEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class NotificationRow
{
    public long Id { get; set; }
    public int? RecipientUserId { get; set; }
    public string? RecipientEmail { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Channel { get; set; } = "internal";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "pendiente";
    public string? ModuleId { get; set; }
    public string? RecordId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public int Attempts { get; set; }
    public string? Error { get; set; }
}

public sealed class RecordLinkRequestRow
{
    public long Id { get; set; }
    public string ModuleId { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public int RequestingUserId { get; set; }
    public int? AllyEntityId { get; set; }
    public string RequestedScope { get; set; } = "responsable";
    public string Reason { get; set; } = string.Empty;
    public string? EvidenceText { get; set; }
    public string Status { get; set; } = "pendiente";
    public int? ReviewerUserId { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class RecordDuplicateCandidateRow
{
    public long Id { get; set; }
    public string ModuleId { get; set; } = string.Empty;
    public string SourceRecordId { get; set; } = string.Empty;
    public string CandidateRecordId { get; set; } = string.Empty;
    public string SimilarityLevel { get; set; } = "media";
    public decimal? SimilarityScore { get; set; }
    public string EvidenceJson { get; set; } = "{}";
    public string Status { get; set; } = "pendiente";
    public string? Decision { get; set; }
    public string? DecisionComment { get; set; }
    public int? ReviewerUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class RecordQualityFlagRow
{
    public long Id { get; set; }
    public string ModuleId { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string FlagType { get; set; } = string.Empty;
    public string Severity { get; set; } = "media";
    public string Status { get; set; } = "abierta";
    public string? Detail { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class EntityProfileRow
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? Description { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? OtherUrl { get; set; }
    public string CoverageLevel { get; set; } = "municipal";
    public string? DepartmentCode { get; set; }
    public string? MunicipalityCode { get; set; }
    public string? AddressText { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string StatusCode { get; set; } = "borrador";
    public bool IsActive { get; set; } = true;
    public int CreatedByUserId { get; set; }
    public int? ResponsibleUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public sealed class UserEntityRow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EntityId { get; set; }
    public string EntityRole { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public sealed class EntityRelationRow
{
    public int Id { get; set; }
    public int SourceEntityId { get; set; }
    public int TargetEntityId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public sealed class EntitySourceRecordRow
{
    public int Id { get; set; }
    public int EntityId { get; set; }
    public string SourceTable { get; set; } = string.Empty;
    public int SourceRecordId { get; set; }
    public int? EcosystemRecordId { get; set; }
    public bool IsPrimary { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public sealed class EntityReviewHistoryRow
{
    public int Id { get; set; }
    public int EntityId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ParticipationSubmissionRow
{
    public string Reference { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
    public string ActorType { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
}
