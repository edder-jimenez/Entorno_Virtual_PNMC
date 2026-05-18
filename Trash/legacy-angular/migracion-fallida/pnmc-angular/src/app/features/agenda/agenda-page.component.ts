import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgendaEvent } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import { DataStateComponent } from '../../shared/ui/data-state.component';

@Component({
  selector: 'app-agenda-page',
  imports: [CommonModule, FormsModule, DataStateComponent],
  template: `
    <section class="hero">
      <p class="tag">Agenda</p>
      <h1>Programación <span>Territorial</span></h1>
      <p>Consulta actividades, encuentros y procesos culturales por categoría y territorio.</p>
    </section>

    <section class="workspace">
      <aside class="filters-panel">
        <h2>Filtros</h2>
        <input [(ngModel)]="search" (input)="applyFilters()" placeholder="Buscar por título o lugar" />
        <select [(ngModel)]="selectedDepartment" (change)="applyFilters()">
          <option value="">Todos los departamentos</option>
          <option *ngFor="let department of departments" [value]="department">{{ department }}</option>
        </select>
        <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
        </select>
        <button type="button" (click)="reload()">Actualizar agenda</button>
      </aside>

      <div class="results-panel">
        <app-data-state
          [loading]="loading"
          [error]="error"
          [empty]="!loading && !error && filteredItems.length === 0"
          loadingMessage="Cargando agenda..."
          emptyMessage="No hay eventos aún."
        />

        <div class="list" *ngIf="!loading && !error && filteredItems.length > 0">
          <article *ngFor="let item of filteredItems" class="item">
            <p class="meta">{{ item.category || 'Sin categoría' }} · {{ item.date || 'Sin fecha' }}</p>
            <h3>{{ item.title }}</h3>
            <p class="location">
              {{ item.municipality || 'Sin municipio' }}, {{ item.department || 'Sin departamento' }}
              <span *ngIf="item.timeLabel"> · {{ item.timeLabel }}</span>
            </p>
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
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: 0.8rem;
      }
      .filters-panel {
        border: 1px solid #d7def0;
        border-radius: 1.4rem;
        background: #291242;
        color: #fff;
        padding: 1rem;
        display: grid;
        gap: 0.55rem;
        align-self: start;
        position: sticky;
        top: 6.4rem;
      }
      .filters-panel h2 {
        margin: 0 0 0.25rem;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 1rem;
        color: #8bf784;
      }
      .filters-panel input,
      .filters-panel select {
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 0.7rem;
        background: rgba(255,255,255,0.06);
        color: #fff;
        padding: 0.45rem 0.55rem;
        font-size: 0.8rem;
      }
      .filters-panel button {
        margin-top: 0.2rem;
        border: 1px solid #00da5e;
        border-radius: 999px;
        background: #00da5e;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.4rem 0.75rem;
        font-size: 0.72rem;
      }
      .results-panel {
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        background: #fff;
        padding: 1.15rem;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
      }
      .list {
        display: grid;
        gap: 0.6rem;
      }
      .item {
        border: 1px solid #e2e8f0;
        border-radius: 1.05rem;
        padding: 1rem;
        border-left: 4px solid #00da5e;
      }
      .meta {
        margin: 0;
        color: #64748b;
        font-size: 0.8rem;
      }
      h3 {
        margin: 0.35rem 0;
        color: #291242;
        font-size: 1.16rem;
      }
      .location {
        margin: 0;
        color: #475569;
        font-size: 0.95rem;
      }
      @media (max-width: 980px) {
        .workspace { grid-template-columns: 1fr; }
        .filters-panel {
          position: static;
        }
      }
      @media (max-width: 900px) {
        .hero { border-radius: 1.2rem; }
      }
    `,
  ],
})
export class AgendaPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = false;
  error = '';

  items: AgendaEvent[] = [];
  filteredItems: AgendaEvent[] = [];
  departments: string[] = [];
  categories: string[] = [];

  search = '';
  selectedDepartment = '';
  selectedCategory = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getAgenda(500).subscribe({
      next: (response) => {
        this.items = response.items ?? [];
        this.departments = this.distinct(this.items.map((item) => item.department ?? '').filter(Boolean));
        this.categories = this.distinct(this.items.map((item) => item.category ?? '').filter(Boolean));
        this.applyFilters();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar agenda desde backend.');
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredItems = this.items.filter((item) => {
      if (this.selectedDepartment && (item.department ?? '') !== this.selectedDepartment) return false;
      if (this.selectedCategory && (item.category ?? '') !== this.selectedCategory) return false;

      if (!term) return true;

      return (
        (item.title ?? '').toLowerCase().includes(term)
        || (item.municipality ?? '').toLowerCase().includes(term)
        || (item.department ?? '').toLowerCase().includes(term)
      );
    });
  }

  private distinct(values: string[]): string[] {
    return values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
  }
}
