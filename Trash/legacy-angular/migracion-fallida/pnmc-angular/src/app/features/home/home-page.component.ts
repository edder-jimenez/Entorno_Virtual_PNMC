import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <p class="eyebrow">PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA 2025-2035</p>
        <h1>Huellas y Apuestas de la <span>Diversidad Sonora</span></h1>
        <p class="lead">
          Un pacto colectivo que reconoce la música como un derecho cultural y un bien común en todo el territorio nacional.
        </p>
        <div class="actions">
          <a routerLink="/pnmc" class="btn btn-primary">Sobre el PNMC</a>
          <a routerLink="/ejes" class="btn btn-ghost">Explorar Ejes</a>
        </div>
      </div>
    </section>

    <section class="pnmc-preview">
      <div class="pnmc-left">
        <div class="watermark">IDENTIDAD</div>
        <h2>HUELLA Y EVOLUCIÓN</h2>
        <p class="intro">
          El <strong>PNMC 2025-2035</strong> es una herramienta para que la música sea motor de vida, paz y justicia social.
        </p>
        <p class="desc">
          Desde hace más de dos décadas, el Plan Nacional de Música para la Convivencia promueve la diversidad cultural
          de Colombia como un pilar para la paz y la equidad.
        </p>
        <div class="preview-image"></div>
      </div>
      <div class="pnmc-right">
        <p class="mini">EL PNMC TIENE UNA ESTRUCTURA ESTRATÉGICA</p>
        <h3>PLANTEADA EN TRES EJES BASE</h3>

        <a routerLink="/ejes" fragment="musica-para-la-vida" class="axis-card">
          <span>01</span>
          <div>
            <h4>Música para la vida</h4>
            <p>Apropiación · Enfoque poblacional</p>
          </div>
        </a>

        <a routerLink="/ejes" fragment="oficios-y-practicas" class="axis-card">
          <span>02</span>
          <div>
            <h4>Prácticas y oficios</h4>
            <p>Formación · Creación · Circulación · Memoria</p>
          </div>
        </a>

        <a routerLink="/ejes" fragment="gobernanza" class="axis-card">
          <span>03</span>
          <div>
            <h4>Gobernanza</h4>
            <p>Participación · Sostenibilidad</p>
          </div>
        </a>

        <a routerLink="/pnmc" class="details-btn">Detalles del PNMC</a>
      </div>
    </section>

    <section class="media-strip">
      <article>
        <p class="chip">Mapa Ecosistémico</p>
        <h3>Participa en el mapeo musical de Colombia</h3>
        <p>Registra procesos, organizaciones, festivales, mercados y espacios culturales en el ecosistema.</p>
        <a routerLink="/participacion">Haz parte de este mapeo</a>
      </article>
      <article>
        <p class="chip">Celebra la Música</p>
        <h3>Activa la circulación musical en tu territorio</h3>
        <p>Conoce rutas y recursos para fortalecer programación y redes de circulación.</p>
        <a routerLink="/estrategia/circulacion">Explorar estrategia</a>
      </article>
      <article>
        <p class="chip">Territorios Sonoros</p>
        <h3>Explora turismo cultural y músicas regionales</h3>
        <p>Conecta circulación, investigación y saberes locales en torno a la diversidad sonora.</p>
        <a routerLink="/estrategia/investigacion">Ver territorios sonoros</a>
      </article>
    </section>

    <section class="map-preview">
      <div class="head">
        <h2>Mapa Ecosistémico</h2>
        <a routerLink="/participacion">Haz parte de este mapeo</a>
      </div>
      <div class="grid">
        <a routerLink="/mapa" class="map-card"><h3>Festivales</h3><p>Capas territoriales y registros activos.</p></a>
        <a routerLink="/mapa" class="map-card"><h3>Mercados</h3><p>Nodos de circulación y dinamización sectorial.</p></a>
        <a routerLink="/mapa" class="map-card"><h3>Escuelas</h3><p>Procesos formativos y cobertura por territorio.</p></a>
        <a routerLink="/mapa" class="map-card"><h3>Redes</h3><p>Conexión entre agentes y actores culturales.</p></a>
      </div>
      <div class="cta-row">
        <div>
          <h4>Explora el Mapa Ecosistémico de Colombia</h4>
          <p>Base de datos nacional del sector musical</p>
        </div>
        <a routerLink="/mapa" class="go-map">Acceder al mapa</a>
      </div>
    </section>

    <section class="news-agenda">
      <div class="news-col">
        <h2>Actualidad</h2>
        <div class="news-cards">
          <a routerLink="/noticias" class="news-main">
            <h3>Narrativas Sonoras del PNMC</h3>
            <p>Crónicas, lanzamientos y contexto del ecosistema musical en los territorios.</p>
          </a>
          <a routerLink="/noticias" class="news-item"><h4>Nueva agenda de encuentros territoriales</h4></a>
          <a routerLink="/noticias" class="news-item"><h4>Convocatoria abierta para circulación musical</h4></a>
        </div>
        <a routerLink="/noticias" class="all-link">Explorar todas las noticias</a>
      </div>

      <aside class="agenda-col">
        <div class="agenda-head">
          <h3>Agenda <span>Prográmate</span></h3>
        </div>
        <a routerLink="/agenda" class="agenda-item" *ngFor="let event of events">
          <div class="date">
            <strong>{{ event.day }}</strong>
            <span>{{ event.month }}</span>
          </div>
          <div class="info">
            <h4>{{ event.title }}</h4>
            <p>{{ event.place }}</p>
          </div>
        </a>
        <a routerLink="/agenda" class="agenda-link">Ver calendario completo</a>
      </aside>
    </section>

    <section class="strategies">
      <a routerLink="/estrategia/circulacion" class="strategy-card">
        <p class="chip">Estrategia de Circulación</p>
        <h3>Celebra la Música</h3>
        <p>Activa escenarios, programación y redes para conectar procesos musicales.</p>
      </a>
      <a routerLink="/estrategia/investigacion" class="strategy-card">
        <p class="chip">Estrategia de Investigación</p>
        <h3>Territorios Sonoros</h3>
        <p>Impulsa investigación, cartografía y documentación de la diversidad sonora.</p>
      </a>
    </section>
  `,
  styles: [
    `
      :host { display: grid; gap: 1rem; }

      .hero {
        position: relative;
        overflow: hidden;
        min-height: calc(100svh - 8rem);
        border-radius: 1.6rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: #291242;
        display: flex;
        align-items: flex-end;
        color: #fff;
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(rgba(41, 18, 66, 0.58), rgba(41, 18, 66, 0.82)),
          radial-gradient(100rem 50rem at 20% -5%, rgba(139, 247, 132, 0.22), transparent 70%);
      }
      .hero-content {
        position: relative;
        z-index: 1;
        padding: 2.4rem 2.2rem 2.8rem;
        max-width: 58rem;
      }
      .hero h1 {
        margin: 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.01em;
        line-height: 1.06;
        font-size: clamp(2rem, 5.2vw, 4.5rem);
      }
      .hero h1 span { display: block; color: #00da5e; font-style: italic; }
      .eyebrow {
        margin: 0 0 0.6rem;
        color: #8bf784;
        font-family: 'Oswald', sans-serif;
        font-size: 0.62rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .lead {
        margin: 0.95rem 0 0;
        max-width: 38rem;
        color: #dbe6f6;
        border-left: 1px solid rgba(139, 247, 132, 0.36);
        padding-left: 0.9rem;
      }
      .actions { display: flex; gap: 0.7rem; margin-top: 1.15rem; flex-wrap: wrap; }
      .btn {
        text-decoration: none;
        border-radius: 0.8rem;
        font-family: 'Oswald', sans-serif;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        font-size: 0.72rem;
        padding: 0.86rem 1.1rem;
      }
      .btn-primary { background: #00da5e; border: 1px solid #00da5e; color: #291242; }
      .btn-ghost { border: 1px solid rgba(255, 255, 255, 0.26); color: #fff; }

      .pnmc-preview {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 1rem;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        padding: 1rem;
      }
      .pnmc-left { text-align: left; }
      .watermark {
        font-family: 'Oswald', sans-serif;
        font-size: clamp(2.2rem, 8vw, 5.8rem);
        color: rgba(41, 18, 66, 0.08);
        line-height: 0.9;
      }
      .pnmc-left h2 {
        margin: -0.5rem 0 0;
        font-family: 'Oswald', sans-serif;
        color: #291242;
        text-transform: uppercase;
        font-size: clamp(1.2rem, 3vw, 2.2rem);
      }
      .intro { margin: 0.8rem 0 0; color: #291242; font-size: 1rem; }
      .desc {
        margin: 0.7rem 0 0;
        color: #64748b;
        border-left: 1px solid #cbd5e1;
        padding-left: 0.8rem;
        font-size: 0.85rem;
      }
      .preview-image {
        margin-top: 0.8rem;
        border-radius: 1.3rem;
        height: 220px;
        background:
          linear-gradient(rgba(15, 23, 42, 0.28), rgba(15, 23, 42, 0.42)),
          url('https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop') center/cover;
      }
      .pnmc-right { text-align: left; display: flex; flex-direction: column; gap: 0.55rem; }
      .mini {
        margin: 0;
        color: #94a3b8;
        font-size: 0.58rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-family: 'Oswald', sans-serif;
      }
      .pnmc-right h3 {
        margin: 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        font-size: 1.3rem;
        text-transform: uppercase;
      }
      .axis-card {
        display: grid;
        grid-template-columns: 2.4rem minmax(0,1fr);
        gap: 0.55rem;
        align-items: start;
        text-decoration: none;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        background: #fff;
        padding: 0.75rem;
      }
      .axis-card span {
        font-family: 'Oswald', sans-serif;
        color: #8bf784;
        font-size: 1.45rem;
        line-height: 1;
      }
      .axis-card h4 { margin: 0; color: #291242; font-size: 0.84rem; text-transform: uppercase; }
      .axis-card p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.7rem; }
      .details-btn {
        align-self: flex-start;
        margin-top: 0.25rem;
        text-decoration: none;
        background: #291242;
        color: #fff;
        border-radius: 0.8rem;
        padding: 0.68rem 0.85rem;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 0.64rem;
      }

      .media-strip {
        background: #291242;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 1.4rem;
        padding: 0.85rem;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.6rem;
      }
      .media-strip article {
        border-radius: 1rem;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.12);
        padding: 0.8rem;
      }
      .chip {
        margin: 0;
        display: inline-flex;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        color: #8bf784;
        font-size: 0.55rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-family: 'Oswald', sans-serif;
      }
      .media-strip h3 { margin: 0.45rem 0 0; color: #fff; font-size: 0.94rem; }
      .media-strip p { margin: 0.4rem 0 0; color: #dbe6f6; font-size: 0.75rem; }
      .media-strip a {
        display: inline-flex;
        margin-top: 0.55rem;
        text-decoration: none;
        color: #291242;
        background: #8bf784;
        border-radius: 999px;
        padding: 0.33rem 0.66rem;
        font-size: 0.62rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-family: 'Oswald', sans-serif;
      }

      .map-preview {
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        background: #fff;
        overflow: hidden;
      }
      .map-preview .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.6rem;
        padding: 0.95rem;
      }
      .map-preview .head h2 {
        margin: 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.2rem;
      }
      .map-preview .head a {
        text-decoration: none;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0.34rem 0.7rem;
        color: #291242;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-family: 'Oswald', sans-serif;
      }
      .map-preview .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0,1fr));
        gap: 0;
      }
      .map-card {
        text-decoration: none;
        border-top: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        padding: 1rem 0.8rem;
        min-height: 170px;
        background:
          linear-gradient(rgba(41,18,66,0.62), rgba(41,18,66,0.84)),
          url('https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop') center/cover;
      }
      .map-card:nth-child(4n) { border-right: 0; }
      .map-card h3 { margin: 0; color: #8bf784; font-size: 1rem; text-transform: uppercase; }
      .map-card p { margin: 0.4rem 0 0; color: #e2e8f0; font-size: 0.75rem; }
      .cta-row {
        background: #291242;
        color: #fff;
        padding: 0.95rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
      }
      .cta-row h4 {
        margin: 0;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.05rem;
      }
      .cta-row p {
        margin: 0.25rem 0 0;
        color: #94a3b8;
        font-size: 0.64rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .go-map {
        text-decoration: none;
        background: #00da5e;
        color: #291242;
        border-radius: 0.8rem;
        padding: 0.62rem 0.86rem;
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        font-family: 'Oswald', sans-serif;
        white-space: nowrap;
      }

      .news-agenda {
        display: grid;
        grid-template-columns: 1.6fr 0.9fr;
        gap: 0.8rem;
      }
      .news-col,
      .agenda-col {
        border: 1px solid #e2e8f0;
        border-radius: 1.4rem;
        background: #fff;
        padding: 0.9rem;
      }
      .news-col h2 {
        margin: 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.2rem;
      }
      .news-cards {
        margin-top: 0.65rem;
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 0.55rem;
      }
      .news-main {
        grid-column: 1 / -1;
        text-decoration: none;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.85rem;
        background: #f8fafc;
      }
      .news-main h3,
      .news-item h4 {
        margin: 0;
        color: #291242;
        font-size: 0.92rem;
      }
      .news-main p { margin: 0.45rem 0 0; color: #64748b; font-size: 0.8rem; }
      .news-item {
        text-decoration: none;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.75rem;
      }
      .all-link {
        margin-top: 0.65rem;
        display: inline-flex;
        text-decoration: none;
        color: #291242;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0.34rem 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-family: 'Oswald', sans-serif;
        font-size: 0.64rem;
      }

      .agenda-head h3 {
        margin: 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.1rem;
      }
      .agenda-head span { color: #00da5e; font-style: italic; }
      .agenda-item {
        margin-top: 0.55rem;
        text-decoration: none;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.65rem;
        display: grid;
        grid-template-columns: 3rem minmax(0,1fr);
        gap: 0.55rem;
      }
      .date {
        border-radius: 0.8rem;
        background: #291242;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 3rem;
      }
      .date strong { font-size: 1rem; line-height: 1; }
      .date span { font-size: 0.52rem; text-transform: uppercase; }
      .info h4 { margin: 0; color: #291242; font-size: 0.8rem; }
      .info p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.72rem; }
      .agenda-link {
        display: inline-flex;
        margin-top: 0.65rem;
        text-decoration: none;
        background: #291242;
        color: #fff;
        border-radius: 0.8rem;
        padding: 0.56rem 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-family: 'Oswald', sans-serif;
        font-size: 0.64rem;
      }

      .strategies {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 0.8rem;
      }
      .strategy-card {
        text-decoration: none;
        border-radius: 1.5rem;
        border: 1px solid #e2e8f0;
        min-height: 240px;
        padding: 1rem;
        background:
          linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.9)),
          url('https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop') center/cover;
      }
      .strategy-card h3 {
        margin: 0.5rem 0 0;
        color: #291242;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.35rem;
      }
      .strategy-card p {
        margin: 0.5rem 0 0;
        color: #475569;
        font-size: 0.84rem;
      }

      @media (max-width: 1100px) {
        .pnmc-preview { grid-template-columns: 1fr; }
        .media-strip { grid-template-columns: 1fr; }
        .map-preview .grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .news-agenda { grid-template-columns: 1fr; }
      }
      @media (max-width: 900px) {
        .hero { min-height: 62svh; border-radius: 1.2rem; }
        .hero-content { padding: 1.4rem 1.2rem 1.7rem; }
        .strategies { grid-template-columns: 1fr; }
        .news-cards { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .lead { font-size: 0.9rem; }
        .btn { font-size: 0.66rem; }
        .map-preview .grid { grid-template-columns: 1fr; }
        .cta-row { flex-direction: column; align-items: flex-start; }
      }
    `,
  ],
})
export class HomePageComponent {
  readonly events = [
    { day: '24', month: 'ABR', title: 'Encuentro territorial de formación', place: 'Bogotá D.C.' },
    { day: '02', month: 'MAY', title: 'Mesa de circulación regional', place: 'Medellín, Antioquia' },
    { day: '17', month: 'MAY', title: 'Laboratorio de memoria musical', place: 'Pasto, Nariño' },
    { day: '29', month: 'MAY', title: 'Rueda de articulación intersectorial', place: 'Cali, Valle del Cauca' },
  ];
}
