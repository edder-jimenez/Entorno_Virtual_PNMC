import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { STRATEGIES, findComponentById } from './content-data';

@Component({
  selector: 'app-strategy-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card" *ngIf="strategy(); else unknownStrategy">
      <p class="eyebrow">{{ strategy()!.context }}</p>
      <h2>{{ strategy()!.title }}</h2>
      <p class="summary">{{ strategy()!.summary }}</p>

      <div class="grid">
        <article>
          <h3>Líneas principales</h3>
          <ul>
            <li *ngFor="let item of strategy()!.highlights">{{ item }}</li>
          </ul>
        </article>
        <article>
          <h3>Componentes relacionados</h3>
          <ul>
            <li *ngFor="let componentId of strategy()!.relatedComponentIds">
              <a [routerLink]="['/ejes/componentes', componentId]">
                {{ getComponentName(componentId) }}
              </a>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <ng-template #unknownStrategy>
      <section class="card">
        <p class="eyebrow">Estrategia</p>
        <h2>En desarrollo</h2>
        <p class="summary">La estrategia solicitada no está disponible en esta ruta.</p>
      </section>
    </ng-template>
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
      }
      .summary {
        margin: 0.75rem 0 0;
        color: #475569;
      }
      .grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.75rem;
      }
      article {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        padding: 0.85rem;
      }
      h3 {
        margin: 0;
        font-size: 0.9rem;
      }
      ul {
        margin: 0.6rem 0 0;
        padding-left: 1rem;
      }
      li {
        margin-bottom: 0.35rem;
        color: #334155;
      }
      a {
        color: #1e293b;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class StrategyPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly section = toSignal(
    this.route.data.pipe(map((data) => (data['section'] as 'circulacion' | 'investigacion' | undefined) ?? undefined)),
    { initialValue: undefined },
  );

  readonly strategy = computed(() => {
    return STRATEGIES.find((item) => item.key === this.section()) ?? null;
  });

  getComponentName(componentId: string): string {
    return findComponentById(componentId)?.name ?? componentId;
  }
}
