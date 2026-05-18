import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewsArticle } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import { DataStateComponent } from '../../shared/ui/data-state.component';

@Component({
  selector: 'app-news-page',
  imports: [CommonModule, FormsModule, DataStateComponent],
  template: `
    <section class="hero">
      <p class="tag">Noticias</p>
      <h1>Noticias y <span>Actualidad</span></h1>
      <p>Crónicas, lanzamientos y reportes del impacto sonoro en los territorios nacionales.</p>
    </section>

    <section class="workspace">
      <header class="toolbar">
        <div>
          <h2>Narrativas Sonoras</h2>
          <p>Explora los contenidos más recientes del PNMC.</p>
        </div>
        <button type="button" (click)="reload()">Actualizar</button>
      </header>

      <div class="filters">
        <input [(ngModel)]="search" (input)="applyFilters()" placeholder="Buscar por título o resumen" />
        <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
        </select>
      </div>

      <app-data-state
        [loading]="loading"
        [error]="error"
        [empty]="!loading && !error && filteredItems.length === 0"
        loadingMessage="Cargando noticias..."
        emptyMessage="No hay noticias aún."
      />

      <div *ngIf="!loading && !error && filteredItems.length > 0" class="results">
        <article class="featured" (click)="openDetail(filteredItems[0])">
          <p class="meta">{{ filteredItems[0].category || 'Sin categoría' }} · {{ filteredItems[0].date || 'Sin fecha' }}</p>
          <h3>{{ filteredItems[0].title }}</h3>
          <p>{{ filteredItems[0].summary || 'Sin resumen disponible.' }}</p>
        </article>

        <div class="list">
          <article *ngFor="let item of filteredItems.slice(1)" class="item" (click)="openDetail(item)">
            <p class="meta">{{ item.category || 'Sin categoría' }} · {{ item.date || 'Sin fecha' }}</p>
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary || 'Sin resumen disponible.' }}</p>
          </article>
        </div>
      </div>
    </section>

    <div class="overlay" *ngIf="selectedArticle" (click)="closeDetail()">
      <article class="detail" (click)="$event.stopPropagation()">
        <header>
          <p class="meta">{{ selectedArticle.category || 'Sin categoría' }} · {{ selectedArticle.date || 'Sin fecha' }}</p>
          <h3>{{ selectedArticle.title }}</h3>
        </header>
        <p>{{ selectedArticle.summary || 'Sin resumen disponible.' }}</p>
        <button type="button" (click)="closeDetail()">Cerrar</button>
      </article>
    </div>
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
        padding: 1.2rem;
        background:
          radial-gradient(60rem 20rem at 100% -10%, rgba(139, 247, 132, 0.08), transparent 65%),
          #fff;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 0.8rem;
      }
      .toolbar h2 {
        margin: 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        color: #291242;
        font-size: 1.6rem;
      }
      .toolbar p {
        margin: 0.3rem 0 0;
        color: #64748b;
        font-size: 0.95rem;
      }
      .toolbar button {
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 999px;
        padding: 0.38rem 0.76rem;
        font-size: 0.76rem;
      }
      .filters {
        margin-top: 0.8rem;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 0.55rem;
      }
      .filters input,
      .filters select {
        border: 1px solid #cbd5e1;
        border-radius: 0.7rem;
        padding: 0.45rem 0.6rem;
        font-size: 0.82rem;
      }
      .results {
        margin-top: 0.95rem;
        display: grid;
        gap: 0.7rem;
      }
      .featured {
        border-radius: 1.2rem;
        border: 1px solid #d8e1f0;
        border-left: 5px solid #00da5e;
        background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%);
        padding: 1.2rem;
        cursor: pointer;
      }
      .list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 0.65rem;
      }
      .item {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1rem;
        cursor: pointer;
      }
      .item:hover,
      .featured:hover { border-color: #94a3b8; }
      .meta {
        margin: 0;
        color: #64748b;
        font-size: 0.8rem;
      }
      h3 {
        margin: 0.35rem 0;
        color: #291242;
        font-size: 1.18rem;
      }
      .item p,
      .featured p { margin: 0; color: #475569; font-size: 0.95rem; }

      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: grid;
        place-items: center;
        z-index: 1000;
        padding: 1rem;
      }
      .detail {
        width: min(700px, 100%);
        background: #fff;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        padding: 1rem;
      }
      .detail button {
        margin-top: 0.8rem;
        border: 1px solid #cbd5e1;
        background: #fff;
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
      }
      @media (max-width: 900px) {
        .hero { border-radius: 1.2rem; }
        .filters { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class NewsPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = false;
  error = '';

  items: NewsArticle[] = [];
  filteredItems: NewsArticle[] = [];
  categories: string[] = [];

  search = '';
  selectedCategory = '';
  selectedArticle: NewsArticle | null = null;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getNews(300).subscribe({
      next: (response) => {
        this.items = response.items ?? [];
        this.categories = this.distinct(this.items.map((item) => item.category ?? '').filter(Boolean));
        this.applyFilters();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar noticias desde backend.');
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredItems = this.items.filter((item) => {
      if (this.selectedCategory && (item.category ?? '') !== this.selectedCategory) return false;
      if (!term) return true;
      return (
        (item.title ?? '').toLowerCase().includes(term)
        || (item.summary ?? '').toLowerCase().includes(term)
      );
    });
  }

  openDetail(item: NewsArticle): void {
    this.selectedArticle = item;
  }

  closeDetail(): void {
    this.selectedArticle = null;
  }

  private distinct(values: string[]): string[] {
    return values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
  }
}
