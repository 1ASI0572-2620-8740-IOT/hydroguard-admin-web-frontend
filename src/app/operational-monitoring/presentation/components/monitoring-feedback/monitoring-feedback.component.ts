import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
@Component({
  selector: 'hg-monitoring-feedback',
  standalone: true,
  imports: [MatButtonModule, MatProgressBarModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" aria-label="Cargando monitoreo" />
    }
    @if (error()) {
      <div class="feedback" role="alert">
        <span>{{ error() }}</span
        ><button mat-button type="button" (click)="retry.emit()">Reintentar</button>
      </div>
    }
  `,
  styles: `
    .feedback {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
      padding: 12px 16px;
      border: 1px solid #fecaca;
      border-radius: 12px;
      background: #fff1f2;
      color: #991b1b;
    }
  `,
})
export class MonitoringFeedbackComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retry = output<void>();
}
