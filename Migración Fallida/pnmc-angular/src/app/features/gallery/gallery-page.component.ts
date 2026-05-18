import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { GalleryAlbum } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';
import { DataStateComponent } from '../../shared/ui/data-state.component';

@Component({
  selector: 'app-gallery-page',
  imports: [CommonModule, DataStateComponent],
  template: `
    <section class="card">
      <header class="header">
        <h2>Galería</h2>
        <button type="button" (click)="reload()">Actualizar</button>
      </header>

      <app-data-state
        [loading]="loading"
        [error]="error"
        [empty]="!loading && !error && albums.length === 0"
        loadingMessage="Cargando galería..."
        emptyMessage="Aún no hay álbumes en SQL para este módulo."
      />

      <div class="albums" *ngIf="!loading && !error && albums.length > 0">
        <article class="album" *ngFor="let album of albums">
          <img *ngIf="album.cover" [src]="album.cover" [alt]="album.title" />
          <div class="body">
            <h3>{{ album.title }}</h3>
            <p class="meta">{{ album.category || 'Archivo' }} · {{ album.location || 'Sin ubicación' }}</p>
            <p>{{ album.description || 'Sin descripción.' }}</p>
            <p class="count">Fotos: {{ photoCount(album) }}</p>
          </div>
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
      .albums {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 0.75rem;
      }
      .album {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        overflow: hidden;
        background: #fff;
      }
      .album img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        display: block;
        background: #f1f5f9;
      }
      .body {
        padding: 0.8rem;
      }
      .body h3 {
        margin: 0 0 0.35rem;
        font-size: 0.95rem;
      }
      .meta {
        margin: 0;
        font-size: 0.75rem;
        color: #64748b;
      }
      .body p {
        margin: 0.35rem 0 0;
        color: #475569;
        font-size: 0.82rem;
      }
      .count {
        font-weight: 600;
        color: #1f2937;
      }
    `,
  ],
})
export class GalleryPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = false;
  error = '';
  albums: GalleryAlbum[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getGalleryAlbums().subscribe({
      next: (response) => {
        this.albums = response.items ?? [];
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = toApiErrorMessage(error, 'No pudimos cargar galería desde backend.');
        this.loading = false;
      },
    });
  }

  photoCount(album: GalleryAlbum): number {
    return (album.sections ?? []).reduce((acc, section) => acc + (section.photos?.length ?? 0), 0);
  }
}
