import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AgendaEvent,
  DepartmentDrilldownResponse,
  DivipolaLocation,
  EditorialResource,
  Festival,
  GalleryAlbum,
  MapSummaryResponse,
  MusicMarket,
  MusicSchool,
  NewsArticle,
  Organization,
  PagedResponse,
  ParticipationSubmissionRequest,
  ParticipationSubmissionResponse,
  ProcessEntityRelation,
  ProcessRelation,
  SpaceInfrastructure,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getNews(limit = 50, offset = 0): Observable<PagedResponse<NewsArticle>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<NewsArticle>>(`${this.baseUrl}/v1/news/articles`, { params });
  }

  getAgenda(limit = 50, offset = 0): Observable<PagedResponse<AgendaEvent>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<AgendaEvent>>(`${this.baseUrl}/v1/agenda/events`, { params });
  }

  getEditorial(params?: { q?: string; section?: string; year?: string; limit?: number; offset?: number }): Observable<PagedResponse<EditorialResource>> {
    let httpParams = new HttpParams();
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.section) httpParams = httpParams.set('section', params.section);
    if (params?.year) httpParams = httpParams.set('year', params.year);
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    if (params?.offset !== undefined) httpParams = httpParams.set('offset', params.offset);
    return this.http.get<PagedResponse<EditorialResource>>(`${this.baseUrl}/v1/editorial/resources`, {
      params: httpParams,
    });
  }

  getMapSummary(layer = 'General'): Observable<MapSummaryResponse> {
    const params = new HttpParams().set('layer', layer);
    return this.http.get<MapSummaryResponse>(`${this.baseUrl}/v1/map/summary`, { params });
  }

  getMapTopology(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/v1/map/topojson/territories`);
  }

  getDepartmentDrilldown(departmentCode: string): Observable<DepartmentDrilldownResponse> {
    return this.http.get<DepartmentDrilldownResponse>(`${this.baseUrl}/v1/map/departments/${departmentCode}/drilldown`);
  }

  getDivipolaLocations(limit = 500, offset = 0): Observable<PagedResponse<DivipolaLocation>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<DivipolaLocation>>(`${this.baseUrl}/v1/divipola/locations`, { params });
  }

  getDivipolaGrouped(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(`${this.baseUrl}/v1/divipola/grouped`);
  }

  async getAllDivipolaLocations(): Promise<DivipolaLocation[]> {
    const pageSize = 500;
    let offset = 0;
    let total = Number.MAX_SAFE_INTEGER;
    const items: DivipolaLocation[] = [];

    while (offset < total) {
      const page = await lastValueFrom(this.getDivipolaLocations(pageSize, offset));
      items.push(...(page.items ?? []));
      total = page.total ?? items.length;
      offset += pageSize;

      if ((page.items ?? []).length === 0) {
        break;
      }
    }

    return items;
  }

  getFestivals(limit = 100, offset = 0): Observable<PagedResponse<Festival>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<Festival>>(`${this.baseUrl}/v1/festivals`, { params });
  }

  getMusicSchools(limit = 100, offset = 0): Observable<PagedResponse<MusicSchool>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<MusicSchool>>(`${this.baseUrl}/v1/music-schools`, { params });
  }

  getMusicMarkets(limit = 100, offset = 0): Observable<PagedResponse<MusicMarket>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<MusicMarket>>(`${this.baseUrl}/v1/music-markets`, { params });
  }

  getOrganizations(limit = 100, offset = 0): Observable<PagedResponse<Organization>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<Organization>>(`${this.baseUrl}/v1/organizations`, { params });
  }

  getSpacesInfrastructure(limit = 100, offset = 0): Observable<PagedResponse<SpaceInfrastructure>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<SpaceInfrastructure>>(`${this.baseUrl}/v1/spaces-infrastructure`, { params });
  }

  getProcessEntityRelations(limit = 100, offset = 0): Observable<PagedResponse<ProcessEntityRelation>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<ProcessEntityRelation>>(`${this.baseUrl}/v1/process-entity-relations`, {
      params,
    });
  }

  getProcessRelations(limit = 100, offset = 0): Observable<PagedResponse<ProcessRelation>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PagedResponse<ProcessRelation>>(`${this.baseUrl}/v1/process-relations`, {
      params,
    });
  }

  createParticipationSubmission(payload: ParticipationSubmissionRequest): Observable<ParticipationSubmissionResponse> {
    return this.http.post<ParticipationSubmissionResponse>(`${this.baseUrl}/v1/participation/submissions`, payload);
  }

  getGalleryAlbums(featuredOnly?: boolean): Observable<{ items: GalleryAlbum[] }> {
    let params = new HttpParams();
    if (featuredOnly !== undefined) params = params.set('featuredOnly', featuredOnly);
    return this.http.get<{ items: GalleryAlbum[] }>(`${this.baseUrl}/v1/gallery/albums`, { params });
  }

  getAdminSchema(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/v1/admin/data/schema`);
  }

  getAdminStats(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/v1/admin/data/stats`);
  }
}
