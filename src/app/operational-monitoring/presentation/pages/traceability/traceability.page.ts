import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GetDeviceTraceabilityUseCase } from '../../../application/use-cases/get-device-traceability.use-case';
import { GenerateTraceabilityReportUseCase } from '../../../application/use-cases/generate-traceability-report.use-case';
import { GetMonitoringOverviewUseCase } from '../../../application/use-cases/get-monitoring-overview.use-case';
import { MonitoringQueryState } from '../../../application/state/monitoring-query-state';
import {
  DeviceStatusView,
  TraceabilityDetail,
  TraceabilityReport,
} from '../../../domain/models/monitoring';
import { MonitoringFeedbackComponent } from '../../components/monitoring-feedback/monitoring-feedback.component';
import { MonitoringLabelPipe } from '../../state/monitoring-label.pipe';
import { getErrorMessage } from '../../../../shared/utils/error-message';

const dateValue = (date: Date) => date.toISOString().slice(0, 10);
@Component({
  selector: 'hg-traceability-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MonitoringFeedbackComponent,
    MonitoringLabelPipe,
  ],
  templateUrl: './traceability.page.html',
  styleUrl: '../../monitoring-page.css',
})
export class TraceabilityPage implements OnInit {
  private readonly getTraceability = inject(GetDeviceTraceabilityUseCase);
  private readonly generate = inject(GenerateTraceabilityReportUseCase);
  private readonly getOverview = inject(GetMonitoringOverviewUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly state = new MonitoringQueryState<TraceabilityDetail>();
  readonly devices = signal<ReadonlyArray<DeviceStatusView>>([]);
  readonly report = signal<TraceabilityReport | null>(null);
  readonly generating = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly filters = this.fb.nonNullable.group({
    deviceId: ['', Validators.required],
    from: [dateValue(new Date(Date.now() - 7 * 86400000)), Validators.required],
    to: [dateValue(new Date()), Validators.required],
  });
  ngOnInit(): void {
    void this.prepare();
  }
  private async prepare(): Promise<void> {
    try {
      const overview = await this.getOverview.execute();
      this.devices.set(overview.devices);
      const requested = this.route.snapshot.queryParamMap.get('deviceId');
      const selected = overview.devices.some((item) => item.deviceId === requested)
        ? requested!
        : (overview.devices[0]?.deviceId ?? '');
      this.filters.controls.deviceId.setValue(selected);
      if (selected) await this.reload();
    } catch (error: unknown) {
      this.actionError.set(getErrorMessage(error, 'No se pudieron cargar los dispositivos.'));
    }
  }
  reload(): Promise<void> {
    const value = this.filters.getRawValue();
    this.report.set(null);
    return this.state.load((signal) =>
      this.getTraceability.execute(value.deviceId, value.from, value.to, signal),
    );
  }
  async generateReport(): Promise<void> {
    this.filters.markAllAsTouched();
    if (this.filters.invalid || this.generating()) return;
    this.generating.set(true);
    this.actionError.set(null);
    try {
      this.report.set(await this.generate.execute(this.filters.getRawValue()));
    } catch (error: unknown) {
      this.actionError.set(getErrorMessage(error, 'No se pudo generar el reporte.'));
    } finally {
      this.generating.set(false);
    }
  }
  downloadCsv(): void {
    const report = this.report();
    if (!report) return;
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      [
        'Fecha',
        'Tipo',
        'Evento',
        'Descripción',
        'Actor',
        'Ciclo',
        'pH',
        'Temperatura',
        'Resultado',
      ],
      ...report.events.map((event) => [
        event.occurredAt,
        event.eventType,
        event.title,
        event.description,
        event.actor,
        event.cycleId ?? '',
        event.ph ?? '',
        event.temperature ?? '',
        event.outcome,
      ]),
    ];
    const blob = new Blob(['\ufeff' + rows.map((row) => row.map(quote).join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `trazabilidad-${report.deviceSerialNumber}-${report.from}-${report.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
