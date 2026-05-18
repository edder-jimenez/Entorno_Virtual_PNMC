import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { feature as topojsonFeature } from 'topojson-client';
import {
  DepartmentDrilldownResponse,
  DivipolaLocation,
  MapDepartmentSummary,
} from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';

type MapLayer = 'General' | 'Festivales' | 'Escuelas de Música' | 'Mercados Musicales';

interface TopologyLike {
  type: 'Topology';
  objects: Record<string, unknown>;
}

@Component({
  selector: 'app-map-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="hero">
      <p class="tag">Mapa Ecosistémico</p>
      <h1>Lectura Territorial <span>DIVIPOLA</span></h1>
      <p>Visualiza capas de festivales, escuelas y mercados musicales por departamento y municipio.</p>
    </section>

    <section class="workspace">
      <header class="header">
        <h2>Capas del Ecosistema</h2>
        <button type="button" (click)="reload()">Actualizar</button>
      </header>

      <div class="filters">
        <select [(ngModel)]="activeLayer" (change)="loadSummary()">
          <option *ngFor="let layer of layers" [value]="layer">{{ layer }}</option>
        </select>
        <select [(ngModel)]="selectedDepartmentCode" (change)="onDepartmentCodeChanged()">
          <option value="">Selecciona departamento (código DIVIPOLA)</option>
          <option *ngFor="let dept of departments" [value]="dept.code">
            {{ dept.code }} - {{ dept.name }}
          </option>
        </select>
        <label class="checkbox">
          <input
            type="checkbox"
            [disabled]="!selectedDepartmentCode"
            [(ngModel)]="showMunicipalities"
            (change)="updateMapLayers()"
          />
          <span>Mostrar municipios del departamento seleccionado</span>
        </label>
      </div>

      <p *ngIf="topologyError" class="state error">{{ topologyError }}</p>
      <p *ngIf="loadingSummary" class="state">Cargando resumen territorial...</p>
      <p *ngIf="summaryError" class="state error">{{ summaryError }}</p>

      <div class="map-shell">
        <div #mapHost class="map-host"></div>
      </div>

      <div *ngIf="!loadingSummary && !summaryError" class="summary-grid">
        <article class="summary-card" *ngFor="let item of summaryItems" (click)="selectDepartment(item.department)">
          <h3>{{ item.department }}</h3>
          <p>Total: {{ item.records }}</p>
          <p>Festivales: {{ item.festivals }}</p>
          <p>Escuelas: {{ item.schools }}</p>
          <p>Mercados: {{ item.markets }}</p>
        </article>
      </div>

      <div class="drilldown" *ngIf="selectedDepartmentCode">
        <h3>Detalle por departamento ({{ selectedDepartmentCode }})</h3>
        <p *ngIf="loadingDrilldown" class="state">Cargando detalle...</p>
        <p *ngIf="drilldownError" class="state error">{{ drilldownError }}</p>

        <div *ngIf="drilldown && !loadingDrilldown" class="drilldown-grid">
          <article>
            <h4>Festivales ({{ drilldown.festivals.length }})</h4>
            <ul>
              <li *ngFor="let item of drilldown.festivals">{{ item.name }} · {{ item.municipality }}</li>
            </ul>
          </article>
          <article>
            <h4>Escuelas ({{ drilldown.schools.length }})</h4>
            <ul>
              <li *ngFor="let item of drilldown.schools">
                {{ item.name }} · {{ item.municipality }} · Estudiantes: {{ item.students }}
              </li>
            </ul>
          </article>
          <article>
            <h4>Mercados ({{ drilldown.markets.length }})</h4>
            <ul>
              <li *ngFor="let item of drilldown.markets">{{ item.name }} · {{ item.municipality }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: grid; gap: 1rem; }
      .hero {
        border-radius: 1.7rem;
        border: 1px solid rgba(255,255,255,0.14);
        background:
          radial-gradient(84rem 25rem at 72% -15%, rgba(139,247,132,0.22), transparent 64%),
          linear-gradient(145deg, #291242 0%, #4f2874 100%);
        color: #fff;
        padding: 1.6rem 1.3rem;
      }
      .tag {
        margin: 0;
        color: #8bf784;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-family: 'Oswald', sans-serif;
        font-size: 0.6rem;
      }
      .hero h1 {
        margin: 0.45rem 0 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: clamp(2.1rem, 5vw, 3.9rem);
        line-height: 1.04;
      }
      .hero h1 span { color: #00da5e; }
      .hero p { margin: 0.8rem 0 0; color: #dbe6f6; max-width: 44rem; }

      .workspace {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1.5rem;
        padding: 1.2rem;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header h2 {
        margin: 0;
        font-size: 1.6rem;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
      }
      .header button {
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .filters {
        margin-top: 0.9rem;
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 0.65rem;
        align-items: center;
      }
      .filters select {
        border: 1px solid #cbd5e1;
        border-radius: 0.7rem;
        padding: 0.45rem 0.6rem;
        font-size: 0.92rem;
      }
      .checkbox {
        grid-column: 1 / -1;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #475569;
      }
      .state {
        margin: 1rem 0 0;
        color: #475569;
      }
      .state.error {
        color: #b91c1c;
      }
      .map-shell {
        margin-top: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 1.1rem;
        overflow: hidden;
      }
      .map-host {
        width: 100%;
        height: 560px;
        background: #f8fafc;
      }
      .summary-grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 0.7rem;
      }
      .summary-card {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1rem;
        cursor: pointer;
        border-left: 4px solid #00da5e;
      }
      .summary-card h3 {
        margin: 0 0 0.4rem;
        font-size: 1.1rem;
      }
      .summary-card p {
        margin: 0.1rem 0;
        color: #475569;
        font-size: 0.88rem;
      }
      .drilldown {
        margin-top: 1rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
      }
      .drilldown h3 {
        margin: 0;
        font-size: 1rem;
      }
      .drilldown-grid {
        margin-top: 0.75rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.75rem;
      }
      .drilldown-grid article {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1rem;
      }
      .drilldown-grid h4 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: #291242;
      }
      .drilldown-grid ul {
        margin: 0;
        padding-left: 1rem;
        max-height: 250px;
        overflow: auto;
      }
      .drilldown-grid li {
        margin-bottom: 0.3rem;
        font-size: 0.9rem;
      }
      @media (max-width: 800px) {
        .filters {
          grid-template-columns: 1fr;
        }
        .map-host {
          height: 460px;
        }
      }
      @media (max-width: 900px) {
        .hero { border-radius: 1.2rem; }
      }
    `,
  ],
})
export class MapPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  @ViewChild('mapHost') private mapHostRef?: ElementRef<HTMLDivElement>;

  readonly layers: MapLayer[] = ['General', 'Festivales', 'Escuelas de Música', 'Mercados Musicales'];
  activeLayer: MapLayer = 'General';

  loadingSummary = false;
  summaryError = '';
  summaryItems: MapDepartmentSummary[] = [];

  loadingDrilldown = false;
  drilldownError = '';
  drilldown: DepartmentDrilldownResponse | null = null;

  topologyError = '';
  showMunicipalities = false;

  selectedDepartmentCode = '';
  departments: Array<{ code: string; name: string }> = [];
  private readonly departmentCodeByName = new Map<string, string>();
  private readonly departmentSummaryByCode = new Map<string, MapDepartmentSummary>();

  private map?: L.Map;
  private departmentLayer?: L.GeoJSON;
  private municipalityLayer?: L.GeoJSON;
  private departmentGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
  private municipalityGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
  private viewReady = false;

  ngOnInit(): void {
    void this.reload();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeMap();
    this.updateMapLayers();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  async reload(): Promise<void> {
    this.summaryError = '';
    this.topologyError = '';
    try {
      await Promise.all([this.loadDepartments(), this.loadTopology()]);
    } catch (error) {
      this.topologyError = toApiErrorMessage(error, 'No pudimos preparar los datos base del mapa.');
    }
    this.loadSummary();
    if (this.selectedDepartmentCode) this.loadDrilldown(this.selectedDepartmentCode);
  }

  private initializeMap(): void {
    if (!this.viewReady || this.map || !this.mapHostRef) return;

    this.map = L.map(this.mapHostRef.nativeElement, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 12,
    }).setView([4.5, -74], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
  }

  async loadDepartments(): Promise<void> {
    const rows = await this.api.getAllDivipolaLocations();
    const byCode = new Map<string, string>();
    this.departmentCodeByName.clear();

    for (const row of rows) {
      if (!row.departmentCode || !row.departmentName) continue;
      byCode.set(row.departmentCode, row.departmentName);
      this.departmentCodeByName.set(this.normalizeText(row.departmentName), row.departmentCode);
    }

    this.departments = [...byCode.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async loadTopology(): Promise<void> {
    this.topologyError = '';
    try {
      const raw = await new Promise<unknown>((resolve, reject) => {
        this.api.getMapTopology().subscribe({ next: resolve, error: reject });
      });

      const topology = raw as TopologyLike;
      if (!topology || topology.type !== 'Topology') {
        throw new Error('Formato TopoJSON inválido.');
      }

      const departmentObject = topology.objects['MGN_ADM_DPTO_POLITICO'];
      const municipalityObject = topology.objects['MGN_ADM_MPIO_GRAFICO'];
      if (!departmentObject || !municipalityObject) {
        throw new Error('No se encontraron capas de departamentos/municipios en el TopoJSON.');
      }

      const departmentResult = topojsonFeature(topology as never, departmentObject as never) as unknown;
      const municipalityResult = topojsonFeature(topology as never, municipalityObject as never) as unknown;

      this.departmentGeoJson = this.toFeatureCollection(departmentResult);
      this.municipalityGeoJson = this.toFeatureCollection(municipalityResult);
      this.updateMapLayers();
    } catch (error) {
      this.topologyError = toApiErrorMessage(error, 'No pudimos cargar la cartografía TopoJSON.');
    }
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.summaryError = '';
    this.departmentSummaryByCode.clear();

    this.api.getMapSummary(this.activeLayer).subscribe({
      next: (response) => {
        this.summaryItems = response.items ?? [];
        for (const item of this.summaryItems) {
          const code = this.departmentCodeByName.get(this.normalizeText(item.department));
          if (code) this.departmentSummaryByCode.set(code, item);
        }
        this.loadingSummary = false;
        this.updateMapLayers();
      },
      error: (error: unknown) => {
        this.summaryError = toApiErrorMessage(error, 'No pudimos cargar el resumen territorial.');
        this.loadingSummary = false;
      },
    });
  }

  selectDepartment(departmentName: string): void {
    const code = this.departmentCodeByName.get(this.normalizeText(departmentName));
    if (!code) return;
    this.selectedDepartmentCode = code;
    this.showMunicipalities = true;
    this.loadDrilldown(code);
    this.updateMapLayers();
  }

  onDepartmentCodeChanged(): void {
    if (!this.selectedDepartmentCode) {
      this.drilldown = null;
      this.drilldownError = '';
      this.showMunicipalities = false;
      this.updateMapLayers();
      return;
    }
    this.loadDrilldown(this.selectedDepartmentCode);
    this.updateMapLayers();
  }

  loadDrilldown(departmentCode: string): void {
    this.loadingDrilldown = true;
    this.drilldownError = '';
    this.api.getDepartmentDrilldown(departmentCode).subscribe({
      next: (response) => {
        this.drilldown = response;
        this.loadingDrilldown = false;
      },
      error: (error: unknown) => {
        this.drilldownError = toApiErrorMessage(error, 'No pudimos cargar el detalle del departamento.');
        this.loadingDrilldown = false;
      },
    });
  }

  updateMapLayers(): void {
    if (!this.map || !this.departmentGeoJson) return;

    this.departmentLayer?.removeFrom(this.map);
    this.municipalityLayer?.removeFrom(this.map);

    this.departmentLayer = L.geoJSON(this.departmentGeoJson, {
      style: (feature) => this.getDepartmentStyle(feature?.properties ?? {}),
      onEachFeature: (feature, layer) => {
        const props = feature.properties as Record<string, unknown>;
        const code = this.normalizeCode(props['dpto_ccdgo']);
        const name = String(props['dpto_cnmbr'] ?? code ?? 'Departamento');
        const summary = code ? this.departmentSummaryByCode.get(code) : undefined;

        layer.bindTooltip(name, { direction: 'center', sticky: true });
        layer.bindPopup(this.buildDepartmentPopup(name, code, summary));
        layer.on('click', () => {
          if (!code) return;
          this.selectedDepartmentCode = code;
          this.showMunicipalities = true;
          this.loadDrilldown(code);
          this.updateMapLayers();
        });
      },
    }).addTo(this.map);

    if (this.showMunicipalities && this.selectedDepartmentCode && this.municipalityGeoJson) {
      const filteredMunicipalities: FeatureCollection<Geometry, GeoJsonProperties> = {
        ...this.municipalityGeoJson,
        features: this.municipalityGeoJson.features.filter((feature) => {
          const props = feature.properties as Record<string, unknown>;
          return this.normalizeCode(props['dpto_ccdgo']) === this.selectedDepartmentCode;
        }),
      };

      this.municipalityLayer = L.geoJSON(filteredMunicipalities, {
        style: {
          color: '#0f172a',
          weight: 0.8,
          fillColor: '#93c5fd',
          fillOpacity: 0.35,
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as Record<string, unknown>;
          const name = String(props['mpio_cnmbr'] ?? 'Municipio');
          const code = String(props['mpio_cdpmp'] ?? props['mpio_ccdgo'] ?? '');
          layer.bindTooltip(`${name} (${code})`, { direction: 'top', sticky: true });
        },
      }).addTo(this.map);
    }

    if (this.selectedDepartmentCode) {
      const selectedBounds = this.findDepartmentBounds(this.selectedDepartmentCode);
      if (selectedBounds) {
        this.map.fitBounds(selectedBounds.pad(0.1));
        return;
      }
    }

    const allBounds = this.departmentLayer.getBounds();
    if (allBounds.isValid()) this.map.fitBounds(allBounds.pad(0.05));
  }

  private getDepartmentStyle(properties: Record<string, unknown>): L.PathOptions {
    const code = this.normalizeCode(properties['dpto_ccdgo']);
    const summary = code ? this.departmentSummaryByCode.get(code) : undefined;
    const value = summary?.records ?? 0;
    const selected = code && code === this.selectedDepartmentCode;

    let fill = '#e2e8f0';
    if (value >= 15) fill = '#14532d';
    else if (value >= 8) fill = '#22c55e';
    else if (value >= 4) fill = '#86efac';
    else if (value >= 1) fill = '#dcfce7';

    return {
      color: selected ? '#291242' : '#334155',
      weight: selected ? 2.4 : 1.2,
      fillColor: fill,
      fillOpacity: selected ? 0.85 : 0.75,
    };
  }

  private findDepartmentBounds(departmentCode: string): L.LatLngBounds | null {
    if (!this.departmentGeoJson) return null;

    const targetFeatures: FeatureCollection<Geometry, GeoJsonProperties> = {
      ...this.departmentGeoJson,
      features: this.departmentGeoJson.features.filter((feature) => {
        const props = feature.properties as Record<string, unknown>;
        return this.normalizeCode(props['dpto_ccdgo']) === departmentCode;
      }),
    };
    if (targetFeatures.features.length === 0) return null;

    const layer = L.geoJSON(targetFeatures);
    const bounds = layer.getBounds();
    return bounds.isValid() ? bounds : null;
  }

  private buildDepartmentPopup(name: string, code: string | null, summary?: MapDepartmentSummary): string {
    return `
      <div style="min-width:200px;font-family:Arial,sans-serif;">
        <strong style="font-size:13px;">${name}</strong><br />
        <small style="color:#475569;">DIVIPOLA: ${code ?? 'N/A'}</small>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0;" />
        <div style="font-size:12px;line-height:1.45;">
          <div>Total: <strong>${summary?.records ?? 0}</strong></div>
          <div>Festivales: <strong>${summary?.festivals ?? 0}</strong></div>
          <div>Escuelas: <strong>${summary?.schools ?? 0}</strong></div>
          <div>Mercados: <strong>${summary?.markets ?? 0}</strong></div>
        </div>
      </div>
    `;
  }

  private normalizeCode(value: unknown): string | null {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return null;
    return digits.padStart(2, '0').slice(-2);
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private toFeatureCollection(input: unknown): FeatureCollection<Geometry, GeoJsonProperties> {
    const candidate = input as FeatureCollection<Geometry, GeoJsonProperties> | Feature<Geometry, GeoJsonProperties>;
    if (candidate && candidate.type === 'FeatureCollection' && Array.isArray(candidate.features)) {
      return candidate;
    }

    if (candidate && candidate.type === 'Feature') {
      return {
        type: 'FeatureCollection',
        features: [candidate],
      };
    }

    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
}
