import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { CloseQualityIncidentUseCase } from '../../../application/use-cases/close-quality-incident.use-case';
import { GetMonitoringOverviewUseCase } from '../../../application/use-cases/get-monitoring-overview.use-case';
import { ListQualityIncidentsUseCase } from '../../../application/use-cases/list-quality-incidents.use-case';
import { RegisterQualityIncidentUseCase } from '../../../application/use-cases/register-quality-incident.use-case';
import { MonitoringQueryState } from '../../../application/state/monitoring-query-state';
import {
  DeviceStatusView,
  IncidentType,
  MonitoringListQuery,
  MonitoringPage,
  QualityIncident,
} from '../../../domain/models/monitoring';
import { MonitoringFeedbackComponent } from '../../components/monitoring-feedback/monitoring-feedback.component';
import { MonitoringLabelPipe } from '../../state/monitoring-label.pipe';
import { getErrorMessage } from '../../../../shared/utils/error-message';
import { ConfirmationDialogComponent } from '../../../../shared/presentation/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'hg-quality-incidents-page',
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
  templateUrl: './quality-incidents.page.html',
  styleUrl: '../../monitoring-page.css',
})
export class QualityIncidentsPage implements OnInit {
  private readonly listIncidents = inject(ListQualityIncidentsUseCase);
  private readonly registerIncident = inject(RegisterQualityIncidentUseCase);
  private readonly closeIncident = inject(CloseQualityIncidentUseCase);
  private readonly getOverview = inject(GetMonitoringOverviewUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  readonly state = new MonitoringQueryState<MonitoringPage<QualityIncident>>();
  readonly devices = signal<ReadonlyArray<DeviceStatusView>>([]);
  readonly submitting = signal(false);
  readonly actionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly filters = this.fb.nonNullable.group({ searchTerm: '', status: '', type: '' });
  readonly form = this.fb.nonNullable.group({
    deviceId: ['', Validators.required],
    incidentType: ['QUALITY_INCIDENT' as IncidentType, Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
  });
  query: MonitoringListQuery = {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };
  ngOnInit(): void {
    void this.reload();
    void this.getOverview
      .execute()
      .then((value) => this.devices.set(value.devices))
      .catch(() => this.devices.set([]));
  }
  reload(): Promise<void> {
    return this.state.load((signal) => this.listIncidents.execute(this.query, signal));
  }
  applyFilters(): void {
    this.query = { ...this.query, ...this.filters.getRawValue(), page: 1 };
    void this.reload();
  }
  changePage(delta: number): void {
    this.query = { ...this.query, page: Math.max(1, (this.query.page ?? 1) + delta) };
    void this.reload();
  }
  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.actionError.set(null);
    this.success.set(null);
    try {
      await this.registerIncident.execute(this.form.getRawValue());
      this.success.set('El incidente fue registrado y quedó disponible para seguimiento.');
      this.form.controls.description.reset('');
      await this.reload();
    } catch (error: unknown) {
      this.actionError.set(getErrorMessage(error, 'No se pudo registrar el incidente.'));
    } finally {
      this.submitting.set(false);
    }
  }

  async close(incident: QualityIncident): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Cerrar incidente',
            message:
              'El incidente quedará cerrado y se conservará en la trazabilidad. Esta acción no elimina su historial.',
            confirmLabel: 'Cerrar incidente',
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;

    this.actionId.set(incident.id);
    this.actionError.set(null);
    this.success.set(null);
    try {
      await this.closeIncident.execute(incident.id);
      this.success.set('El incidente fue cerrado y el evento quedó registrado en la trazabilidad.');
      await this.reload();
    } catch (error: unknown) {
      this.actionError.set(getErrorMessage(error, 'No se pudo cerrar el incidente.'));
    } finally {
      this.actionId.set(null);
    }
  }
}
