import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AxisObjective {
  title: string;
  summary: string;
  route: string;
  anchor: string;
}

@Component({
  selector: 'app-pnmc-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="overlay"></div>
      <div class="hero-content">
        <p class="tag">Sobre el PNMC</p>
        <h1>Plan Nacional de Música para la Convivencia</h1>
        <p>
          El PNMC 2025-2035 impulsa un ecosistema musical diverso, equitativo y sostenible,
          conectando formación, creación, circulación, memoria y gobernanza cultural en todo el país.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <h2>Propósito General</h2>
        <span></span>
      </div>
      <div class="purpose-grid">
        <article>
          <h3>Visión</h3>
          <p>
            Consolidar la música como derecho cultural y bien común para fortalecer convivencia,
            diversidad y participación territorial.
          </p>
        </article>
        <article>
          <h3>Misión</h3>
          <p>
            Articular capacidades institucionales, comunitarias y sectoriales para garantizar
            condiciones equitativas en prácticas y oficios de la música.
          </p>
        </article>
        <article>
          <h3>Construcción Colectiva</h3>
          <p>
            El plan surge de procesos participativos nacionales con agentes del sector,
            entidades territoriales y ciudadanía cultural.
          </p>
        </article>
      </div>
    </section>

    <section class="section muted">
      <div class="section-title">
        <h2>Objetivos por Eje</h2>
        <span></span>
      </div>
      <div class="axis-grid">
        <article *ngFor="let item of objectives">
          <p class="mini">Eje Estratégico</p>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
          <a [routerLink]="item.route" [fragment]="item.anchor">Explorar eje</a>
        </article>
      </div>
    </section>

    <section class="section dark">
      <div class="section-title light">
        <h2>Enfoques Transversales</h2>
        <span></span>
      </div>
      <div class="focus-grid">
        <article>
          <h3>Biocultural</h3>
          <p>Relación música-territorio, memoria ecológica y saberes locales.</p>
        </article>
        <article>
          <h3>Poblacional</h3>
          <p>Enfoque diferencial para infancia, juventudes, pueblos étnicos y diversidades.</p>
        </article>
        <article>
          <h3>Territorial</h3>
          <p>Estrategias adaptadas a capacidades, vocaciones e infraestructura local.</p>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 1.2rem;
      }
      .hero {
        position: relative;
        overflow: hidden;
        border-radius: 1.8rem;
        min-height: 56svh;
        background:
          radial-gradient(80rem 32rem at 20% -20%, rgba(139, 247, 132, 0.32), transparent 62%),
          linear-gradient(145deg, #291242 0%, #4f2874 100%);
        border: 1px solid rgba(255, 255, 255, 0.14);
      }
      .overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(41, 18, 66, 0.92), rgba(41, 18, 66, 0.52));
      }
      .hero-content {
        position: relative;
        z-index: 1;
        height: 100%;
        padding: 2.4rem 2rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
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
        margin: 0.65rem 0 0;
        color: #fff;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        line-height: 1.05;
        letter-spacing: 0.01em;
        font-size: clamp(1.8rem, 4.2vw, 3.9rem);
      }
      .hero p {
        margin: 0.95rem 0 0;
        max-width: 50rem;
        color: #dbe6f6;
        border-left: 1px solid rgba(139, 247, 132, 0.4);
        padding-left: 0.9rem;
      }
      .section {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        padding: 1.2rem;
      }
      .section.muted {
        background: #f8fafc;
      }
      .section.dark {
        background: #291242;
        border-color: rgba(255, 255, 255, 0.14);
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1rem;
      }
      .section-title h2 {
        margin: 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        color: #291242;
        letter-spacing: 0.04em;
        font-size: 1.25rem;
      }
      .section-title span {
        display: block;
        width: 3.2rem;
        height: 0.34rem;
        border-radius: 999px;
        background: #8bf784;
      }
      .section-title.light h2 {
        color: #fff;
      }
      .purpose-grid,
      .axis-grid,
      .focus-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 0.75rem;
      }
      article {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.95rem;
        background: #fff;
      }
      .dark article {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.04);
      }
      article h3 {
        margin: 0;
        color: #291242;
        font-size: 0.98rem;
      }
      .dark article h3 {
        color: #8bf784;
      }
      article p {
        margin: 0.5rem 0 0;
        color: #475569;
        font-size: 0.83rem;
        line-height: 1.45;
      }
      .dark article p {
        color: #cbd5e1;
      }
      .mini {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-family: 'Oswald', sans-serif;
        font-size: 0.58rem;
        color: #64748b;
      }
      .axis-grid a {
        display: inline-flex;
        margin-top: 0.7rem;
        text-decoration: none;
        color: #291242;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-family: 'Oswald', sans-serif;
      }
      @media (max-width: 900px) {
        .hero {
          min-height: 46svh;
          border-radius: 1.3rem;
        }
        .hero-content {
          padding: 1.5rem 1.2rem;
        }
      }
    `,
  ],
})
export class PnmcPageComponent {
  readonly objectives: AxisObjective[] = [
    {
      title: 'Música para la vida, el diálogo intercultural y la diversidad biocultural',
      summary:
        'Promover formación y práctica musical con enfoque de cuidado, diversidad y convivencia en territorios.',
      route: '/ejes',
      anchor: 'musica-para-la-vida',
    },
    {
      title: 'Fortalecimiento de las prácticas, expresiones y oficios de la música',
      summary:
        'Cualificar creación, formación, circulación, información e infraestructura para sostenibilidad sectorial.',
      route: '/ejes',
      anchor: 'oficios-y-practicas',
    },
    {
      title: 'Gobernanza musical e integración cultural e intersectorial',
      summary:
        'Fortalecer articulación institucional y participación para gestión musical sostenible.',
      route: '/ejes',
      anchor: 'gobernanza',
    },
  ];
}
