import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
@Component({
  selector: 'hg-query-feedback',
  standalone: true,
  imports: [MatButtonModule, MatProgressBarModule],
  template: `@if (loading()) {
      <mat-progress-bar mode="indeterminate" aria-label="Cargando información" />
    }
    @if (error()) {
      <div class="feedback" role="alert">
        <p>{{ error() }}</p>
        <button mat-button type="button" (click)="retry.emit()">Reintentar</button>
      </div>
    }`,
  styles:
    '.feedback { margin: 16px 0; padding: 12px 20px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff1f2; }',
})
export class QueryFeedbackComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();
}
