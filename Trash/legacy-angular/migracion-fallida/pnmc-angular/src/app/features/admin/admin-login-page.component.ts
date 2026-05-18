import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/auth/admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h2>Acceso Admin</h2>
      <p>Ingresa la API key de administración para habilitar endpoints protegidos.</p>

      <form (ngSubmit)="save()" class="form">
        <label>
          API Key
          <input
            type="password"
            name="apiKey"
            [(ngModel)]="apiKey"
            placeholder="Pega aquí la X-Admin-Api-Key"
            required
          />
        </label>

        <div class="actions">
          <button type="submit">Guardar y entrar</button>
          <button type="button" class="muted" (click)="clear()">Limpiar</button>
        </div>
      </form>

      <p *ngIf="message" class="state">{{ message }}</p>
    </section>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1.25rem;
        max-width: 720px;
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      p {
        margin: 0;
        color: #475569;
      }
      .form {
        margin-top: 1rem;
        display: grid;
        gap: 0.7rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.82rem;
        color: #334155;
      }
      input {
        border: 1px solid #cbd5e1;
        border-radius: 0.7rem;
        padding: 0.5rem 0.65rem;
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      button {
        border: 1px solid #291242;
        background: #291242;
        color: #fff;
        border-radius: 999px;
        padding: 0.42rem 0.95rem;
        font-size: 0.82rem;
        cursor: pointer;
      }
      button.muted {
        border-color: #cbd5e1;
        background: #fff;
        color: #334155;
      }
      .state {
        margin-top: 0.6rem;
        font-size: 0.82rem;
        color: #166534;
      }
    `,
  ],
})
export class AdminLoginPageComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  apiKey = this.auth.apiKey;
  message = '';

  save(): void {
    this.auth.setApiKey(this.apiKey);
    this.message = 'API key guardada en sesión.';
    void this.router.navigateByUrl('/admin');
  }

  clear(): void {
    this.auth.clear();
    this.apiKey = '';
    this.message = 'API key eliminada.';
  }
}
