export interface PagedResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary?: string | null;
  category?: string | null;
  date?: string | null;
}

export interface AgendaEvent {
  id: string;
  title: string;
  category?: string | null;
  date?: string | null;
  timeLabel?: string | null;
  municipality?: string | null;
  department?: string | null;
}

export interface EditorialResource {
  id: string;
  title: string;
  year: string;
  section: string;
  displayAuthor: string;
  summary: string;
  url: string;
  thumbnail: string;
  keywords: string[];
}

export interface DivipolaLocation {
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  locationType: string;
}

export interface MapDepartmentSummary {
  department: string;
  records: number;
  festivals: number;
  schools: number;
  markets: number;
}

export interface MapSummaryResponse {
  layer: string;
  items: MapDepartmentSummary[];
}

export interface FestivalDrilldownItem {
  id: string;
  name: string;
  municipality: string;
}

export interface SchoolDrilldownItem {
  id: string;
  name: string;
  municipality: string;
  students: number;
  teachers: number;
}

export interface MarketDrilldownItem {
  id: string;
  name: string;
  municipality: string;
  averageProjects: number;
  averageBuyers: number;
}

export interface DepartmentDrilldownResponse {
  department: string;
  festivals: FestivalDrilldownItem[];
  schools: SchoolDrilldownItem[];
  markets: MarketDrilldownItem[];
}

export interface Festival {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  coverageLevel: string;
  description: string;
  organizerDisplayName: string;
}

export interface MusicSchool {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  schoolType: string;
  studentsTotal: number;
  activeGroupsCount: number;
}

export interface MusicMarket {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  periodicity: string;
  editionsCount: number;
  associatedFestivalDisplayName: string;
}

export interface Organization {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  organizationType: string;
  territorialScope: string;
  contactEmail: string;
  contactPhone: string;
}

export interface SpaceInfrastructure {
  id: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  municipalityCode: string;
  municipalityName: string;
  actorType: string;
  primaryFunction: string;
  maxCapacityApprox: number;
}

export interface ProcessEntityRelation {
  id: string;
  processType: string;
  processId: number;
  entityType: string;
  entityId: number;
  relationshipType: string;
  notes: string;
}

export interface ProcessRelation {
  id: string;
  sourceProcessType: string;
  sourceProcessId: number;
  targetProcessType: string;
  targetProcessId: number;
  relationshipType: string;
  notes: string;
}

export interface ParticipationFestivalLocation {
  department: string;
  municipality: string;
}

export interface ParticipationSubmissionRequest {
  reference?: string;
  actorType: string;
  actorTypeLabel?: string;
  actorName: string;
  individualFirstName?: string;
  individualLastName?: string;
  identificationType?: string;
  identificationNumber?: string;
  hasArtisticName?: boolean;
  artisticName?: string;
  responsibleEntity?: string;
  contactName?: string;
  contactRole?: string;
  email: string;
  phone: string;
  department: string;
  municipality: string;
  territoryScope?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  roles?: string[];
  musicalFields: string;
  description: string;
  contribution: string;
  needs?: string;
  organizationSubtype?: string;
  yearFounded?: string;
  legalStatus?: string;
  mainPrograms?: string;
  festivalDurationDays?: string;
  festivalSetting?: string;
  festivalVenueMode?: string;
  festivalAdditionalLocations?: ParticipationFestivalLocation[];
  festivalFrequency?: string;
  festivalVersions?: string;
  festivalHabitualMonths?: string[];
  festivalTicketing?: string;
  openCall?: string;
  festivalThisYearStatus?: string;
  festivalThisYearDate?: string;
  festivalThisYearStartDate?: string;
  festivalThisYearEndDate?: string;
  festivalCurrentOpenCall?: string;
  festivalOpenCallDeadline?: string;
  marketFrequency?: string;
  marketEditionsCount?: string;
  averageBuyers?: string;
  linkedFestival?: string;
  linkedFestivalName?: string;
  marketHabitualMonths?: string[];
  marketThisYearStatus?: string;
  marketThisYearMonth?: string;
  marketThisYearDate?: string;
  individualProfile?: string;
  trajectoryYears?: string;
  linkedProcesses?: string;
  members?: string;
  musicalPractice?: string;
  circulationScope?: string;
  collectiveTrajectory?: string;
  spaceType?: string;
  spaceCapacity?: string;
  spaceUses?: string;
  technicalEquipment?: string;
  consent: boolean;
}

export interface ParticipationSubmissionResponse {
  reference: string;
  status: string;
  submittedAt: string;
  message: string;
  externalSyncStatus: string;
  externalSyncMessage: string;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  title: string;
  alt: string;
  description: string;
}

export interface GallerySection {
  id: string;
  title: string;
  type: string;
  photos: GalleryPhoto[];
}

export interface GalleryAlbum {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  dateLabel: string;
  featured: boolean;
  cover: string;
  sections: GallerySection[];
}
