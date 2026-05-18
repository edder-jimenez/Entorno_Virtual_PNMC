import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <p class="eyebrow">Navegación</p>
      <h2>Ruta no encontrada</h2>
      <p class="summary">
        La URL solicitada no existe en esta versión Angular. Puedes volver al inicio o abrir un módulo principal.
      </p>
      <div class="actions">
        <a routerLink="/">Ir al inicio</a>
        <a routerLink="/noticias">Ir a noticias</a>
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
      .eyebrow {
        margin: 0;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
      }
      h2 {
        margin: 0.35rem 0 0;
        font-size: 1.2rem;
        color: #1f2937;
      }
      .summary {
        margin: 0.7rem 0 0;
        color: #475569;
      }
      .actions {
        margin-top: 0.9rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      a {
        text-decoration: none;
        color: #291242;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class NotFoundPageComponent {}
