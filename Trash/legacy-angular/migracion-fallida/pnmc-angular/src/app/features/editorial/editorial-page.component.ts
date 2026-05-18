import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorialResource } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import { DataStateComponent } from '../../shared/ui/data-state.component';

@Component({
  selector: 'app-editorial-page',
  imports: [CommonModule, FormsModule, DataStateComponent],
  template: `
    <section class="hero">
      <p class="tag">Editorial</p>
      <h1>Acervo <span>Documental</span></h1>
      <p>Consulta publicaciones, recursos de referencia y contenidos del ecosistema musical.</p>
    </section>

    <section class="workspace">
      <header class="toolbar">
        <h2>Catálogo Editorial</h2>
        <button type="button" (click)="reload()">Actualizar</button>
      </header>

      <div class="filters">
        <input [(ngModel)]="query" placeholder="Buscar título, autor o palabra clave" />
        <select [(ngModel)]="section">
          <option value="">Todas las secciones</option>
          <option *ngFor="let item of sections" [value]="item">{{ item }}</option>
        </select>
        <select [(ngModel)]="year">
          <option value="">Todos los años</option>
          <option *ngFor="let item of years" [value]="item">{{ item }}</option>
        </select>
        <button type="button" (click)="applyFilters()">Filtrar</button>
      </div>

      <app-data-state
        [loading]="loading"
        [error]="error"
        [empty]="!loading && !error && items.length === 0"
        loadingMessage="Cargando editorial..."
        emptyMessage="No hay recursos editoriales aún."
      />

      <ul *ngIf="!loading && !error && items.length > 0" class="list">
        <li *ngFor="let item of items">
          <p class="meta">{{ item.section || 'Sin sección' }} · {{ item.year || 'Sin año' }}</p>
          <h3>{{ item.title }}</h3>
          <p class="author">{{ item.displayAuthor || 'Autor no disponible' }}</p>
          <p class="summary">{{ item.summary || 'Sin resumen disponible.' }}</p>
        </li>
      </ul>
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
        border: 1px solid #e2e8f0;
        border-radius: 1.5rem;
        background: #fff;
        padding: 1.2rem;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .toolbar h2 {
        margin: 0;
        color: #291242;
        text-transform: uppercase;
        font-family: 'Oswald', sans-serif;
        font-size: 1.6rem;
      }
      .toolbar button,
      .filters button {
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 999px;
        padding: 0.38rem 0.76rem;
        font-size: 0.76rem;
      }
      .filters {
        margin-top: 0.75rem;
        display: grid;
        grid-template-columns: 2fr 1fr 1fr auto;
        gap: 0.55rem;
      }
      .filters input,
      .filters select {
        border: 1px solid #cbd5e1;
        border-radius: 0.7rem;
        padding: 0.45rem 0.6rem;
        font-size: 0.82rem;
      }
      .list {
        list-style: none;
        margin: 0.95rem 0 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.6rem;
      }
      .list li {
        border: 1px solid #e2e8f0;
        border-radius: 1.05rem;
        padding: 1rem;
        border-left: 4px solid #8bf784;
      }
      .meta {
        margin: 0;
        color: #64748b;
        font-size: 0.8rem;
      }
      h3 {
        margin: 0.33rem 0;
        color: #291242;
        font-size: 1.14rem;
      }
      .author {
        margin: 0;
        color: #334155;
        font-size: 0.92rem;
      }
      .summary {
        margin: 0.45rem 0 0;
        color: #475569;
        font-size: 0.94rem;
      }
      @media (max-width: 900px) {
        .hero { border-radius: 1.2rem; }
        .filters { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class EditorialPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = false;
  error = '';
  items: EditorialResource[] = [];
  allItems: EditorialResource[] = [];
  query = '';
  section = '';
  year = '';
  sections: string[] = [];
  years: string[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getEditorial({ limit: 500 }).subscribe({
      next: (response) => {
        this.allItems = response.items ?? [];
        this.sections = this.extractDistinct(this.allItems.map((x) => x.section));
        this.years = this.extractDistinct(this.allItems.map((x) => x.year));
        this.applyFilters();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar editorial desde backend.');
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const q = this.query.trim().toLowerCase();
    this.items = this.allItems.filter((item) => {
      if (this.section && item.section !== this.section) return false;
      if (this.year && item.year !== this.year) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q)
        || (item.displayAuthor || '').toLowerCase().includes(q)
        || (item.summary || '').toLowerCase().includes(q)
        || item.keywords.some((keyword) => keyword.toLowerCase().includes(q))
      );
    });
  }

  private extractDistinct(values: string[]): string[] {
    return values
      .map((value) => value?.trim())
      .filter((value) => !!value)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
  }
}
