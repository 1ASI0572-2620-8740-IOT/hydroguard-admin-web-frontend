import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceTelemetrySummary, WaterMeasurement } from '../../../domain/models/water-measurement';
import { ListMeasurementsUseCase } from '../../../application/use-cases/list-measurements.use-case';
import { QueryState } from '../../../application/state/query-state';
import { Page } from '../../../domain/models/page';
import { TelemetryLabelPipe } from '../../state/labels';

export interface TelemetryDialogData {
  summary: DeviceTelemetrySummary;
}

@Component({
  selector: 'hg-telemetry-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    TelemetryLabelPipe,
  ],
  templateUrl: './telemetry-detail-dialog.component.html',
  styleUrl: './telemetry-detail-dialog.component.scss',
})
export class TelemetryDetailDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<TelemetryDetailDialogComponent>);
  private readonly router = inject(Router);
  private readonly listMeasurements = inject(ListMeasurementsUseCase);
  readonly data: TelemetryDialogData = inject(MAT_DIALOG_DATA);

  readonly historyState = new QueryState<Page<WaterMeasurement>>();

  get summary(): DeviceTelemetrySummary {
    return this.data.summary;
  }

  get isOnline(): boolean {
    return this.summary.device.availability === 'ONLINE';
  }

  get macAddress(): string {
    const hash = this.summary.device.id
      .replace(/[^A-Za-z0-9]/g, '')
      .padEnd(6, '0')
      .slice(-6)
      .toUpperCase();
    return `24:6F:28:${hash.slice(0, 2)}:${hash.slice(2, 4)}:${hash.slice(4, 6)}`;
  }

  get firmwareVersion(): string {
    return this.summary.device.operatingEnvironment === 'SIMULATION'
      ? 'v1.4.0-wokwi-sim'
      : 'v2.1.8-esp-idf';
  }

  ngOnInit(): void {
    void this.loadHistory();
  }

  loadHistory(): Promise<void> {
    return this.historyState.load((signal) =>
      this.listMeasurements.execute(
        this.summary.device.id,
        { page: 1, pageSize: 5, sortBy: 'measuredAt', sortDirection: 'desc' },
        signal,
      ),
    );
  }

  goToFullDetail(): void {
    this.dialogRef.close();
    void this.router.navigate(['/telemetry/devices', this.summary.device.id]);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
