import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AcknowledgeOperationalAlertUseCase } from '../../../application/use-cases/acknowledge-operational-alert.use-case';
import { ListOperationalAlertsUseCase } from '../../../application/use-cases/list-operational-alerts.use-case';
import { MonitoringQueryState } from '../../../application/state/monitoring-query-state';
import {
  MonitoringListQuery,
  MonitoringPage,
  OperationalAlert,
} from '../../../domain/models/monitoring';
import { MonitoringFeedbackComponent } from '../../components/monitoring-feedback/monitoring-feedback.component';
import { MonitoringLabelPipe } from '../../state/monitoring-label.pipe';
import { getErrorMessage } from '../../../../shared/utils/error-message';

@Component({
  selector: 'hg-operational-alerts-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MonitoringFeedbackComponent,
    MonitoringLabelPipe,
  ],
  templateUrl: './operational-alerts.page.html',
  styleUrl: '../../monitoring-page.css',
})
export class OperationalAlertsPage implements OnInit {
  private readonly listAlerts = inject(ListOperationalAlertsUseCase);
  private readonly acknowledgeAlert = inject(AcknowledgeOperationalAlertUseCase);
  readonly state = new MonitoringQueryState<MonitoringPage<OperationalAlert>>();
  readonly actionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly filters = inject(FormBuilder).nonNullable.group({
    searchTerm: '',
    status: 'ACTIVE',
    severity: '',
  });
  query: MonitoringListQuery = {
    page: 1,
    pageSize: 10,
    status: 'ACTIVE',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };
  ngOnInit(): void {
    void this.reload();
  }
  reload(): Promise<void> {
    return this.state.load((signal) => this.listAlerts.execute(this.query, signal));
  }
  applyFilters(): void {
    this.query = { ...this.query, ...this.filters.getRawValue(), page: 1 };
    void this.reload();
  }
  changePage(delta: number): void {
    this.query = { ...this.query, page: Math.max(1, (this.query.page ?? 1) + delta) };
    void this.reload();
  }
  async acknowledge(alert: OperationalAlert): Promise<void> {
    this.actionId.set(alert.id);
    this.actionError.set(null);
    try {
      await this.acknowledgeAlert.execute(alert.id);
      await this.reload();
    } catch (error: unknown) {
      this.actionError.set(getErrorMessage(error, 'No se pudo atender la alerta.'));
    } finally {
      this.actionId.set(null);
    }
  }
}
