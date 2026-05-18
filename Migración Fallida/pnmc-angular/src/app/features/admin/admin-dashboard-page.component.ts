import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ApiService } from '../../core/api/api.service';
import { toApiErrorMessage } from '../../core/http/api-error-message';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [CommonModule],
  template: `
    <section class="card">
      <header class="header">
        <h2>Admin Data Console</h2>
        <div class="actions">
          <button type="button" class="muted" (click)="reload()">Actualizar</button>
          <button type="button" class="danger" (click)="logout()">Cerrar sesión</button>
        </div>
      </header>

      <p class="hint">
        Esta vista consume endpoints protegidos con <code>X-Admin-Api-Key</code> vía interceptor.
      </p>

      <p *ngIf="loading" class="state">Cargando datos de administración...</p>
      <p *ngIf="error" class="state error">{{ error }}</p>

      <div *ngIf="!loading && !error" class="grid">
        <article>
          <h3>Stats</h3>
          <pre>{{ statsJson }}</pre>
        </article>
        <article>
          <h3>Schema</h3>
          <pre>{{ schemaJson }}</pre>
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
        gap: 1rem;
        align-items: center;
      }
      .header h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .actions {
        display: flex;
        gap: 0.45rem;
      }
      button {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #334155;
        border-radius: 999px;
        padding: 0.4rem 0.8rem;
        font-size: 0.78rem;
        cursor: pointer;
      }
      button.danger {
        border-color: #fecaca;
        color: #b91c1c;
      }
      .hint {
        margin: 0.65rem 0 0;
        color: #64748b;
        font-size: 0.8rem;
      }
      .state {
        margin: 1rem 0 0;
        color: #475569;
      }
      .state.error {
        color: #b91c1c;
      }
      .grid {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      article {
        border: 1px solid #e2e8f0;
        border-radius: 0.8rem;
        padding: 0.8rem;
      }
      h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.75rem;
        color: #1f2937;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AdminAuthService);

  loading = false;
  error = '';
  statsJson = '{}';
  schemaJson = '{}';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    Promise.all([firstValueFrom(this.api.getAdminStats()), firstValueFrom(this.api.getAdminSchema())])
      .then(([stats, schema]) => {
        this.statsJson = JSON.stringify(stats ?? {}, null, 2);
        this.schemaJson = JSON.stringify(schema ?? {}, null, 2);
        this.loading = false;
      })
      .catch((error: unknown) => {
        this.error = toApiErrorMessage(
          error,
          'No fue posible consultar endpoints admin. Verifica API key y configuración de seguridad en backend.',
        );
        this.loading = false;
      });
  }

  logout(): void {
    this.auth.clear();
    this.statsJson = '{}';
    this.schemaJson = '{}';
    this.error = 'Sesión admin cerrada.';
  }
}
