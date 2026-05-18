import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-state',
  imports: [CommonModule],
  template: `
    <p *ngIf="loading" class="state" aria-live="polite">{{ loadingMessage }}</p>
    <p *ngIf="!loading && !!error" class="state error" role="alert" aria-live="assertive">{{ error }}</p>
    <p *ngIf="!loading && !error && empty" class="state" aria-live="polite">{{ emptyMessage }}</p>
  `,
  styles: [
    `
      .state {
        margin: 1rem 0 0;
        color: #475569;
      }
      .state.error {
        color: #b91c1c;
      }
    `,
  ],
})
export class DataStateComponent {
  @Input() loading = false;
  @Input() error = '';
  @Input() empty = false;
  @Input() loadingMessage = 'Cargando...';
  @Input() emptyMessage = 'No hay registros.';
}
