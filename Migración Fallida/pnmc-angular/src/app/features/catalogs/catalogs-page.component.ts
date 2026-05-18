import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Festival,
  MusicMarket,
  MusicSchool,
  Organization,
  ProcessEntityRelation,
  ProcessRelation,
  SpaceInfrastructure,
} from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import { DataStateComponent } from '../../shared/ui/data-state.component';

@Component({
  selector: 'app-catalogs-page',
  imports: [CommonModule, DataStateComponent],
  template: `
    <section class="card">
      <header class="header">
        <h2>Módulos SQL</h2>
        <button type="button" (click)="reload()">Actualizar</button>
      </header>

      <app-data-state
        [loading]="loading"
        [error]="error"
        [empty]="!loading && !error && allTotals === 0"
        loadingMessage="Cargando módulos..."
        emptyMessage="No hay datos aún en los módulos SQL consultados."
      />

      <div class="stats" *ngIf="!loading && !error">
        <article><h3>Festivales</h3><p>{{ festivals.total }}</p></article>
        <article><h3>Escuelas</h3><p>{{ schools.total }}</p></article>
        <article><h3>Mercados</h3><p>{{ markets.total }}</p></article>
        <article><h3>Organizaciones</h3><p>{{ organizations.total }}</p></article>
        <article><h3>Espacios</h3><p>{{ spaces.total }}</p></article>
        <article><h3>Rel. Proc-Ent</h3><p>{{ processEntityRelations.total }}</p></article>
        <article><h3>Rel. Procesos</h3><p>{{ processRelations.total }}</p></article>
      </div>

      <div class="lists" *ngIf="!loading && !error">
        <article>
          <h4>Festivales</h4>
          <ul><li *ngFor="let item of festivals.items">{{ item.name }} · {{ item.departmentName }}</li></ul>
        </article>
        <article>
          <h4>Escuelas</h4>
          <ul><li *ngFor="let item of schools.items">{{ item.name }} · {{ item.departmentName }}</li></ul>
        </article>
        <article>
          <h4>Mercados</h4>
          <ul><li *ngFor="let item of markets.items">{{ item.name }} · {{ item.departmentName }}</li></ul>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1.25rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .header button {
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .stats {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.6rem;
      }
      .stats article {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        padding: 0.65rem;
      }
      .stats h3 {
        margin: 0;
        font-size: 0.75rem;
        color: #64748b;
      }
      .stats p {
        margin: 0.35rem 0 0;
        font-size: 1rem;
        font-weight: 600;
      }
      .lists {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 0.7rem;
      }
      .lists article {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        padding: 0.8rem;
      }
      .lists h4 {
        margin: 0 0 0.5rem;
        font-size: 0.92rem;
      }
      .lists ul {
        margin: 0;
        padding-left: 1rem;
        max-height: 240px;
        overflow: auto;
      }
      .lists li {
        font-size: 0.8rem;
        margin-bottom: 0.25rem;
      }
    `,
  ],
})
export class CatalogsPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = false;
  error = '';

  festivals: { items: Festival[]; total: number } = { items: [], total: 0 };
  schools: { items: MusicSchool[]; total: number } = { items: [], total: 0 };
  markets: { items: MusicMarket[]; total: number } = { items: [], total: 0 };
  organizations: { items: Organization[]; total: number } = { items: [], total: 0 };
  spaces: { items: SpaceInfrastructure[]; total: number } = { items: [], total: 0 };
  processEntityRelations: { items: ProcessEntityRelation[]; total: number } = { items: [], total: 0 };
  processRelations: { items: ProcessRelation[]; total: number } = { items: [], total: 0 };

  get allTotals(): number {
    return (
      this.festivals.total
      + this.schools.total
      + this.markets.total
      + this.organizations.total
      + this.spaces.total
      + this.processEntityRelations.total
      + this.processRelations.total
    );
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    Promise.all([
      firstValueFrom(this.api.getFestivals()),
      firstValueFrom(this.api.getMusicSchools()),
      firstValueFrom(this.api.getMusicMarkets()),
      firstValueFrom(this.api.getOrganizations()),
      firstValueFrom(this.api.getSpacesInfrastructure()),
      firstValueFrom(this.api.getProcessEntityRelations()),
      firstValueFrom(this.api.getProcessRelations()),
    ])
      .then(([festivals, schools, markets, organizations, spaces, processEntityRelations, processRelations]) => {
        this.festivals = { items: festivals?.items ?? [], total: festivals?.total ?? 0 };
        this.schools = { items: schools?.items ?? [], total: schools?.total ?? 0 };
        this.markets = { items: markets?.items ?? [], total: markets?.total ?? 0 };
        this.organizations = { items: organizations?.items ?? [], total: organizations?.total ?? 0 };
        this.spaces = { items: spaces?.items ?? [], total: spaces?.total ?? 0 };
        this.processEntityRelations = { items: processEntityRelations?.items ?? [], total: processEntityRelations?.total ?? 0 };
        this.processRelations = { items: processRelations?.items ?? [], total: processRelations?.total ?? 0 };
        this.loading = false;
      })
      .catch((error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar uno o más módulos.');
        this.loading = false;
      });
  }
}
