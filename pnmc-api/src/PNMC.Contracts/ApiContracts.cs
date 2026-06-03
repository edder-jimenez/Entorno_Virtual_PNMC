namespace PNMC.Contracts;

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Limit, int Offset, int Total);

public sealed record AgendaEventDto(
    string Id,
    string Title,
    string Description,
    string Category,
    string Date,
    string TimeLabel,
    string Location,
    string Municipality,
    string Department,
    string Organizer,
    string ImageUrl,
    IReadOnlyList<string> Tags
);

public sealed record NewsArticleDto(
    string Id,
    string Date,
    string Category,
    string Title,
    string Summary,
    string ContentHtml,
    string ImageUrl
);

public sealed record MapDepartmentSummaryDto(
    string Department,
    int Records,
    int Festivals,
    int Schools,
    int Markets
);

public sealed record MapSummaryResponseDto(
    string Layer,
    IReadOnlyList<MapDepartmentSummaryDto> Items
);

public sealed record FestivalDrilldownItemDto(string Id, string Name, string Municipality);
public sealed record SchoolDrilldownItemDto(string Id, string Name, string Municipality, int Students, int Teachers);
public sealed record MarketDrilldownItemDto(string Id, string Name, string Municipality, int AverageProjects, int AverageBuyers);

public sealed record DepartmentDrilldownResponseDto(
    string Department,
    IReadOnlyList<FestivalDrilldownItemDto> Festivals,
    IReadOnlyList<SchoolDrilldownItemDto> Schools,
    IReadOnlyList<MarketDrilldownItemDto> Markets
);

public sealed record EditorialResourceDto(
    string Id,
    string Title,
    string Year,
    string Section,
    string SectionPath,
    string PublicationType,
    string Practice,
    string Category,
    string Subcategory,
    string Author,
    string CorporateAuthor,
    string Credits,
    string Isbn,
    string Ismn,
    string FormatSize,
    string Pages,
    string Duration,
    string RegionalScope,
    string Location,
    string Url,
    IReadOnlyList<string> Keywords,
    string Summary,
    string AdditionalFields,
    string CoverText,
    string Thumbnail,
    string DisplayAuthor
);

public sealed record GalleryPhotoDto(string Id, string Src, string Title, string Alt, string Description);
public sealed record GallerySectionDto(string Id, string Title, string Type, IReadOnlyList<GalleryPhotoDto> Photos);
public sealed record GalleryAlbumDto(
    string Id,
    string Title,
    string Category,
    string Description,
    string Location,
    string DateLabel,
    bool Featured,
    string Cover,
    IReadOnlyList<GallerySectionDto> Sections
);

public sealed class ParticipationSubmissionRequest
{
    public string? Reference { get; set; }
    public string ActorType { get; set; } = string.Empty;
    public string ActorTypeLabel { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string IndividualFirstName { get; set; } = string.Empty;
    public string IndividualLastName { get; set; } = string.Empty;
    public string IdentificationType { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public bool HasArtisticName { get; set; }
    public string ArtisticName { get; set; } = string.Empty;
    public string ResponsibleEntity { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string ContactRole { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string TerritoryScope { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];
    public string MusicalFields { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Contribution { get; set; } = string.Empty;
    public string Needs { get; set; } = string.Empty;
    public string OrganizationSubtype { get; set; } = string.Empty;
    public string YearFounded { get; set; } = string.Empty;
    public string LegalStatus { get; set; } = string.Empty;
    public string MainPrograms { get; set; } = string.Empty;
    public string FestivalDurationDays { get; set; } = string.Empty;
    public string FestivalSetting { get; set; } = string.Empty;
    public string FestivalVenueMode { get; set; } = string.Empty;
    public List<ParticipationFestivalLocation> FestivalAdditionalLocations { get; set; } = [];
    public string FestivalFrequency { get; set; } = string.Empty;
    public string FestivalVersions { get; set; } = string.Empty;
    public List<string> FestivalHabitualMonths { get; set; } = [];
    public string FestivalTicketing { get; set; } = string.Empty;
    public string OpenCall { get; set; } = string.Empty;
    public string FestivalThisYearStatus { get; set; } = string.Empty;
    public string FestivalThisYearDate { get; set; } = string.Empty;
    public string FestivalThisYearStartDate { get; set; } = string.Empty;
    public string FestivalThisYearEndDate { get; set; } = string.Empty;
    public string FestivalCurrentOpenCall { get; set; } = string.Empty;
    public string FestivalOpenCallDeadline { get; set; } = string.Empty;
    public string MarketFrequency { get; set; } = string.Empty;
    public string MarketEditionsCount { get; set; } = string.Empty;
    public string AverageBuyers { get; set; } = string.Empty;
    public string LinkedFestival { get; set; } = string.Empty;
    public string LinkedFestivalName { get; set; } = string.Empty;
    public List<string> MarketHabitualMonths { get; set; } = [];
    public string MarketThisYearStatus { get; set; } = string.Empty;
    public string MarketThisYearMonth { get; set; } = string.Empty;
    public string MarketThisYearDate { get; set; } = string.Empty;
    public string IndividualProfile { get; set; } = string.Empty;
    public string TrajectoryYears { get; set; } = string.Empty;
    public string LinkedProcesses { get; set; } = string.Empty;
    public string Members { get; set; } = string.Empty;
    public string MusicalPractice { get; set; } = string.Empty;
    public string CirculationScope { get; set; } = string.Empty;
    public string CollectiveTrajectory { get; set; } = string.Empty;
    public string SpaceType { get; set; } = string.Empty;
    public string SpaceCapacity { get; set; } = string.Empty;
    public string SpaceUses { get; set; } = string.Empty;
    public string TechnicalEquipment { get; set; } = string.Empty;
    public bool Consent { get; set; }
}

public sealed class ParticipationFestivalLocation
{
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
}

public sealed record ParticipationSubmissionResponse(
    string Reference,
    string Status,
    DateTimeOffset SubmittedAt,
    string Message,
    string ExternalSyncStatus,
    string ExternalSyncMessage
);

public sealed record ParticipationSubmissionSummaryDto(
    string Reference,
    DateTimeOffset SubmittedAt,
    string ActorType,
    string ActorName,
    string Email,
    string Department,
    string Municipality,
    string ExternalSyncStatus
);

public sealed class AgendaEventUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string TimeLabel { get; set; } = string.Empty;
    public string EndTimeLabel { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Organizer { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string FestivalId { get; set; } = string.Empty;
    public string SortOrder { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
}

public sealed class NewsArticleUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string QuoteText { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string EmbedUrl { get; set; } = string.Empty;
    public string SortOrder { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class MapFestivalUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string VersionsCount { get; set; } = string.Empty;
    public string LastEditionDate { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Organizer { get; set; } = string.Empty;
    public string OrganizerEmail { get; set; } = string.Empty;
    public string OrganizerPhone { get; set; } = string.Empty;
    public string OrganizerWebsiteUrl { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string OtherUrl { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public bool HasCurrentYearEdition { get; set; }
    public string CurrentYearEditionStatus { get; set; } = string.Empty;
    public string CurrentYearStartDate { get; set; } = string.Empty;
    public string CurrentYearEndDate { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = string.Empty;
}

public sealed class MapSchoolUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SchoolCategory { get; set; } = string.Empty;
    public string SchoolType { get; set; } = string.Empty;
    public string ResponsibleEntity { get; set; } = string.Empty;
    public string DirectorName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string OtherUrl { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string SpecificLocation { get; set; } = string.Empty;
    public string AddressText { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string TrainingCapacity { get; set; } = string.Empty;
    public int Students { get; set; }
    public int ActiveGroupsCount { get; set; }
    public string TrainingProcesses { get; set; } = string.Empty;
    public string MusicalPractices { get; set; } = string.Empty;
    public bool IsActiveSchool { get; set; } = true;
    public string Observations { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = string.Empty;
}

public sealed class MapMarketUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int EditionsCount { get; set; }
    public string Periodicity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool HasCurrentYearEdition { get; set; }
    public string CurrentYearEditionStatus { get; set; } = string.Empty;
    public string CurrentYearStartDate { get; set; } = string.Empty;
    public string CurrentYearEndDate { get; set; } = string.Empty;
    public string ResponsibleEntity { get; set; } = string.Empty;
    public string ResponsibleEntityEmail { get; set; } = string.Empty;
    public string ResponsibleEntityPhone { get; set; } = string.Empty;
    public string ResponsibleEntityWebsiteUrl { get; set; } = string.Empty;
    public string AssociatedFestivalId { get; set; } = string.Empty;
    public string AssociatedFestivalDisplayName { get; set; } = string.Empty;
    public string ScopeType { get; set; } = string.Empty;
    public string MarketMode { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string SpecificLocation { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = string.Empty;
}

public sealed class OrganizationUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string OrganizationType { get; set; } = string.Empty;
    public string TerritorialScope { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string OtherUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = string.Empty;
}

public sealed class SpaceInfrastructureUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ActorType { get; set; } = string.Empty;
    public string WorkshopName { get; set; } = string.Empty;
    public string PrimaryFunction { get; set; } = string.Empty;
    public string Instruments { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string OtherUrl { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string AddressText { get; set; } = string.Empty;
    public string Zone { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public string Status { get; set; } = string.Empty;
}

public sealed class EditorialResourceUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string SectionPath { get; set; } = string.Empty;
    public string PublicationType { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string CorporateAuthor { get; set; } = string.Empty;
    public string Year { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string SortOrder { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = [];
}

public sealed class AdminRecordStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public string? RejectionReason { get; set; }
    public string? ObservedFieldsJson { get; set; }
}

public sealed class ProcessEntityRelationUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string ProcessType { get; set; } = string.Empty;
    public int ProcessId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public sealed class ProcessRelationUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string SourceProcessType { get; set; } = string.Empty;
    public int SourceProcessId { get; set; }
    public string TargetProcessType { get; set; } = string.Empty;
    public int TargetProcessId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public sealed class AdminLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed record AdminUserDto(
    string Id,
    string FullName,
    string Email,
    string Role,
    string RoleLabel,
    bool IsActive,
    DateTime? LastLoginAt,
    string? AllyEntityId = null,
    string? AllyEntityName = null,
    string? Telefono = null
);

public sealed record AdminAuthResponse(AdminUserDto User);

public sealed class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Password { get; set; }
}

public sealed class AdminUserUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed record AdminEntitySummaryDto(
    string Id,
    string EntityType,
    string EntityTypeLabel,
    string Name,
    string LegalName,
    string ContactEmail,
    string ContactPhone,
    string DepartmentCode,
    string Department,
    string MunicipalityCode,
    string Municipality,
    string Status,
    string StatusLabel,
    bool IsActive,
    string ResponsibleUser,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public sealed record AdminEntityRelationDto(
    string Id,
    string SourceEntityId,
    string TargetEntityId,
    string TargetEntityName,
    string RelationshipType,
    string Notes
);

public sealed record AdminEntitySourceRecordDto(
    string Id,
    string EntityId,
    string SourceTable,
    string SourceRecordId,
    string? EcosystemRecordId,
    bool IsPrimary
);

public sealed record AdminEntityReviewEventDto(
    string Id,
    string Action,
    string Comment,
    string UserName,
    DateTime CreatedAt
);

public sealed record AdminEntityDetailDto(
    AdminEntitySummaryDto Entity,
    IReadOnlyList<AdminEntityRelationDto> Relations,
    IReadOnlyList<AdminEntitySourceRecordDto> SourceRecords,
    IReadOnlyList<AdminEntityReviewEventDto> ReviewHistory
);

public sealed class AdminEntityUpsertRequest
{
    public string Id { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string FacebookUrl { get; set; } = string.Empty;
    public string InstagramUrl { get; set; } = string.Empty;
    public string OtherUrl { get; set; } = string.Empty;
    public string CoverageLevel { get; set; } = "municipal";
    public string Department { get; set; } = string.Empty;
    public string Municipality { get; set; } = string.Empty;
    public string AddressText { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string Status { get; set; } = "borrador";
    public string ResponsibleUserId { get; set; } = string.Empty;
}

public sealed class AdminEntityStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public sealed class AdminEntityRelationRequest
{
    public string TargetEntityId { get; set; } = string.Empty;
    public string RelationshipType { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public sealed class AdminEntitySourceRecordRequest
{
    public string SourceTable { get; set; } = string.Empty;
    public string SourceRecordId { get; set; } = string.Empty;
    public string EcosystemRecordId { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = true;
}

public sealed record AdminAllyRequestDto(
    string Id,
    string EntityName,
    string EntityType,
    string Nit,
    string DepartmentCode,
    string MunicipalityCode,
    string InstitutionalEmail,
    string InstitutionalPhone,
    string AdminName,
    string AdminEmail,
    string Status,
    string ReviewComment,
    string? AllyEntityId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class AdminAllyRequestCreateRequest
{
    public string EntityName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string Nit { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string MunicipalityCode { get; set; } = string.Empty;
    public string InstitutionalEmail { get; set; } = string.Empty;
    public string InstitutionalPhone { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
}

public sealed class AdminAllyRequestStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public sealed record NotificationDto(
    string Id,
    string? RecipientUserId,
    string RecipientEmail,
    string EventType,
    string Channel,
    string Title,
    string Body,
    string Status,
    string ModuleId,
    string RecordId,
    DateTime CreatedAt,
    DateTime? SentAt,
    DateTime? ReadAt
);

public sealed class NotificationCreateRequest
{
    public string RecipientEmail { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Channel { get; set; } = "internal";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string MetadataJson { get; set; } = string.Empty;
}

public sealed record RecordLinkRequestDto(
    string Id,
    string ModuleId,
    string RecordId,
    string RequestingUserId,
    string? AllyEntityId,
    string RequestedScope,
    string Reason,
    string EvidenceText,
    string Status,
    string ReviewComment,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class RecordLinkRequestCreateRequest
{
    public string ModuleId { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string RequestedScope { get; set; } = "responsable";
    public string Reason { get; set; } = string.Empty;
    public string EvidenceText { get; set; } = string.Empty;
}

public sealed class RecordLinkRequestStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public sealed record RecordDuplicateCandidateDto(
    string Id,
    string ModuleId,
    string SourceRecordId,
    string CandidateRecordId,
    string SimilarityLevel,
    decimal? SimilarityScore,
    string EvidenceJson,
    string Status,
    string Decision,
    string DecisionComment,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class RecordDuplicateCandidateCreateRequest
{
    public string ModuleId { get; set; } = string.Empty;
    public string SourceRecordId { get; set; } = string.Empty;
    public string CandidateRecordId { get; set; } = string.Empty;
    public string SimilarityLevel { get; set; } = "media";
    public decimal? SimilarityScore { get; set; }
    public string EvidenceJson { get; set; } = "{}";
}

public sealed class RecordDuplicateDecisionRequest
{
    public string Decision { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public sealed record RecordQualityFlagDto(
    string Id,
    string ModuleId,
    string RecordId,
    string FlagType,
    string Severity,
    string Status,
    string Detail,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed class RecordQualityFlagCreateRequest
{
    public string ModuleId { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string FlagType { get; set; } = string.Empty;
    public string Severity { get; set; } = "media";
    public string Detail { get; set; } = string.Empty;
}

public sealed class RecordQualityFlagStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public sealed record AllyPortalUserDto(
    string Id,
    string FullName,
    string Email,
    string Role,
    string AllyEntityId,
    string AllyEntityName,
    bool IsActive,
    DateTime LinkedAt
);

public sealed class AllyPortalUserCreateRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class AllyPortalUserStatusRequest
{
    public bool IsActive { get; set; }
}

public sealed record ExternalRegisterResponse(
    string UserId,
    string Email,
    string AccountStatus,
    string VerificationStatus,
    DateTime CodeExpiresAt,
    string DebugVerificationCode
);

public sealed class ExternalRegisterRequest
{
    public string ProfileType { get; set; } = string.Empty;
    public string ActorType { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public string MunicipalityCode { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool AcceptTerms { get; set; }
    public bool AcceptDataPolicy { get; set; }
    public bool AuthorizePublicData { get; set; }
}

public sealed class ExternalVerifyEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public sealed record ExternalVerifyEmailResponse(
    string UserId,
    string Email,
    string AccountStatus
);

public sealed record FestivalDto(
    string Id,
    string Name,
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string CoverageLevel,
    string Description,
    string SpecificLocation,
    int VersionsCount,
    string LastEditionDate,
    string OrganizerDisplayName,
    string ContactEmail,
    string ContactPhone,
    string WebsiteUrl,
    bool HasCurrentYearEdition,
    string CurrentYearEditionStatus,
    string CurrentYearStartDate,
    string CurrentYearEndDate,
    string SonorousTerritories,
    string MusicalPractices
);

public sealed record MusicSchoolDto(
    string Id,
    string Name,
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string CoverageLevel,
    string SpecificLocation,
    string AddressText,
    string SchoolType,
    string SchoolCategory,
    bool IsActiveSchool,
    int StudentsTotal,
    int ActiveGroupsCount,
    bool HasCommunityOrganization,
    string TrainingProcesses,
    string MusicalPractices,
    string ResponsibleEntityDisplayName,
    string ContactEmail,
    string ContactPhone,
    string WebsiteUrl,
    string SonorousTerritories
);

public sealed record MusicMarketDto(
    string Id,
    string Name,
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string CoverageLevel,
    string Description,
    string Periodicity,
    int EditionsCount,
    bool HasAssociatedFestival,
    string AssociatedFestivalDisplayName,
    string ScopeType,
    string MarketMode,
    string ResponsibleEntityDisplayName,
    string ResponsibleEntityContactEmail,
    string ResponsibleEntityContactPhone,
    string ResponsibleEntityWebsiteUrl,
    bool HasCurrentYearEdition,
    string CurrentYearEditionStatus,
    string CurrentYearStartDate,
    string CurrentYearEndDate,
    string SpecificLocation,
    string SonorousTerritories,
    string MusicalPractices
);

public sealed record OrganizationDto(
    string Id,
    string Name,
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string OrganizationType,
    string TerritorialScope,
    string ContactEmail,
    string ContactPhone,
    string SonorousTerritories,
    string MusicalPractices,
    decimal? Latitude,
    decimal? Longitude,
    string Description
);

public sealed record SpaceInfrastructureDto(
    string Id,
    string Name,
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string ActorType,
    string PrimaryFunction,
    int MaxCapacityApprox,
    string SonorousTerritories,
    string MusicalPractices,
    decimal? Latitude,
    decimal? Longitude,
    string Description,
    string ContactEmail,
    string ContactPhone
);

public sealed record DivipolaLocationDto(
    string DepartmentCode,
    string DepartmentName,
    string MunicipalityCode,
    string MunicipalityName,
    string LocationType,
    decimal? Latitude,
    decimal? Longitude
);

public sealed record ProcessEntityRelationDto(
    string Id,
    string ProcessType,
    int ProcessId,
    string EntityType,
    int EntityId,
    string RelationshipType,
    string Notes
);

public sealed record ProcessRelationDto(
    string Id,
    string SourceProcessType,
    int SourceProcessId,
    string TargetProcessType,
    int TargetProcessId,
    string RelationshipType,
    string Notes
);
