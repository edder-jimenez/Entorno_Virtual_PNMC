import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EJES_DATA } from './content-data';

@Component({
  selector: 'app-ejes-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <p class="tag">Ejes</p>
      <h1>Ejes de <span>Transformación</span></h1>
      <p>Explora las dimensiones fundamentales del PNMC y sus componentes estratégicos.</p>
    </section>

    <section
      class="axis"
      *ngFor="let eje of ejes; let ejeIndex = index"
      [attr.id]="anchorByIndex[ejeIndex]"
    >
      <div class="axis-head">
        <div class="axis-title">
          <span>{{ eje.id }}</span>
          <h2>{{ eje.title }}</h2>
        </div>
        <p>{{ eje.purpose }}</p>
      </div>

      <div class="axis-explain">
        <p *ngFor="let paragraph of eje.axisExplain">{{ paragraph }}</p>
      </div>

      <div class="components">
        <article
          class="component"
          *ngFor="let comp of eje.components; let compIndex = index"
          [class.open]="isOpen(eje.id, compIndex)"
        >
          <button type="button" class="component-head" (click)="toggle(eje.id, compIndex)">
            <span class="index">0{{ compIndex + 1 }}</span>
            <h3>{{ comp.name }}</h3>
          </button>

          <div class="component-body" *ngIf="isOpen(eje.id, compIndex)">
            <p>{{ comp.details }}</p>
            <a [routerLink]="['/ejes/componentes', comp.id]">Explorar componente</a>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 1.1rem;
      }
      .hero {
        background:
          radial-gradient(90rem 25rem at 70% -20%, rgba(139, 247, 132, 0.24), transparent 65%),
          linear-gradient(145deg, #291242 0%, #4f2874 100%);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 1.7rem;
        padding: 1.8rem 1.5rem;
        color: #fff;
      }
      .tag {
        margin: 0;
        color: #8bf784;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-family: 'Oswald', sans-serif;
        font-size: 0.62rem;
      }
      .hero h1 {
        margin: 0.45rem 0 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        line-height: 1.05;
        letter-spacing: 0.01em;
        font-size: clamp(1.7rem, 4.5vw, 3.2rem);
      }
      .hero h1 span {
        color: #00da5e;
      }
      .hero p {
        margin: 0.85rem 0 0;
        color: #dbe6f6;
        max-width: 42rem;
      }
      .axis {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        padding: 1rem;
        scroll-margin-top: 6.4rem;
      }
      .axis-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.7rem;
      }
      .axis-title {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
      }
      .axis-title span {
        font-family: 'Oswald', sans-serif;
        color: #8bf784;
        font-size: 2.1rem;
        line-height: 1;
      }
      .axis-title h2 {
        margin: 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        line-height: 1.04;
        font-size: clamp(1.02rem, 2vw, 1.6rem);
      }
      .axis-head p {
        margin: 0;
        color: #475569;
        border-left: 1px solid #cbd5e1;
        padding-left: 0.7rem;
        font-size: 0.87rem;
      }
      .axis-explain {
        margin-top: 0.8rem;
        display: grid;
        gap: 0.45rem;
      }
      .axis-explain p {
        margin: 0;
        color: #64748b;
        font-size: 0.82rem;
      }
      .components {
        margin-top: 0.95rem;
        display: grid;
        gap: 0.6rem;
      }
      .component {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        background: #f8fafc;
      }
      .component.open {
        background: #fff;
        border-color: #8bf784;
      }
      .component-head {
        width: 100%;
        border: 0;
        background: transparent;
        padding: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        text-align: left;
        cursor: pointer;
      }
      .index {
        border-radius: 999px;
        min-width: 2rem;
        text-align: center;
        background: #e2e8f0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        font-size: 0.75rem;
        padding: 0.25rem 0.45rem;
      }
      .component.open .index {
        background: #291242;
        color: #8bf784;
      }
      h3 {
        margin: 0;
        color: #334155;
        font-size: 0.86rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-family: 'Oswald', sans-serif;
      }
      .component-body {
        border-top: 1px solid #e2e8f0;
        padding: 0.75rem 0.85rem 0.9rem;
      }
      .component-body p {
        margin: 0;
        color: #475569;
        font-size: 0.82rem;
      }
      .component-body a {
        display: inline-flex;
        margin-top: 0.65rem;
        text-decoration: none;
        border: 1px solid #cbd5e1;
        color: #291242;
        border-radius: 999px;
        padding: 0.33rem 0.66rem;
        font-family: 'Oswald', sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 0.66rem;
      }
      @media (max-width: 900px) {
        .hero {
          border-radius: 1.2rem;
          padding: 1.3rem 1rem;
        }
      }
    `,
  ],
})
export class EjesPageComponent {
  readonly ejes = EJES_DATA;
  readonly anchorByIndex = ['musica-para-la-vida', 'oficios-y-practicas', 'gobernanza'];

  private readonly openIndexByAxis = new Map<string, number>();

  constructor() {
    for (const eje of this.ejes) {
      this.openIndexByAxis.set(eje.id, 0);
    }
  }

  toggle(axisId: string, index: number): void {
    const current = this.openIndexByAxis.get(axisId);
    this.openIndexByAxis.set(axisId, current === index ? -1 : index);
  }

  isOpen(axisId: string, index: number): boolean {
    return this.openIndexByAxis.get(axisId) === index;
  }
}
