import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { findComponentById } from './content-data';

@Component({
  selector: 'app-component-detail-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero" *ngIf="component(); else notFound">
      <p class="tag">Componente</p>
      <h1>{{ component()!.name }}</h1>
      <p>{{ component()!.details }}</p>
      <a class="back" routerLink="/ejes">Volver a Ejes</a>
    </section>

    <section class="content" *ngIf="component()">
      <article *ngFor="let paragraph of component()!.fullText; let i = index">
        <span>0{{ i + 1 }}</span>
        <p>{{ paragraph }}</p>
      </article>
    </section>

    <ng-template #notFound>
      <section class="hero">
        <p class="tag">Componente</p>
        <h1>Componente no encontrado</h1>
        <p>El identificador solicitado no existe en la matriz actual.</p>
        <a class="back" routerLink="/ejes">Volver a Ejes</a>
      </section>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 0.95rem;
      }
      .hero {
        border-radius: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background:
          radial-gradient(72rem 24rem at 18% -20%, rgba(139, 247, 132, 0.22), transparent 65%),
          linear-gradient(145deg, #291242 0%, #4f2874 100%);
        color: #fff;
        padding: 1.5rem 1.2rem;
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
        margin: 0.48rem 0 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        line-height: 1.05;
        font-size: clamp(1.35rem, 3vw, 2.35rem);
      }
      .hero p {
        margin: 0.75rem 0 0;
        color: #dbe6f6;
        max-width: 56rem;
      }
      .back {
        display: inline-flex;
        margin-top: 0.85rem;
        color: #291242;
        background: #8bf784;
        text-decoration: none;
        border-radius: 999px;
        padding: 0.36rem 0.7rem;
        font-size: 0.68rem;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .content {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1.2rem;
        padding: 0.95rem;
        display: grid;
        gap: 0.6rem;
      }
      .content article {
        border: 1px solid #e2e8f0;
        border-radius: 0.95rem;
        padding: 0.75rem;
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr);
        gap: 0.6rem;
        align-items: start;
      }
      .content span {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #291242;
        color: #8bf784;
        font-family: 'Oswald', sans-serif;
        font-size: 0.7rem;
      }
      .content p {
        margin: 0.25rem 0 0;
        color: #334155;
        font-size: 0.86rem;
        line-height: 1.5;
      }
    `,
  ],
})
export class ComponentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly componentId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('componentId') ?? '')),
    { initialValue: '' },
  );
  readonly component = computed(() => findComponentById(this.componentId()));
}
