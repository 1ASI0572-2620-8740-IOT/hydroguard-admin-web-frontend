import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ListMeasurementsUseCase } from '../../../application/use-cases/list-measurements.use-case';
import { GetLatestMeasurementUseCase } from '../../../application/use-cases/get-latest-measurement.use-case';
import { WaterMeasurement } from '../../../domain/models/water-measurement';
import { MeasurementQuery } from '../../../domain/ports/telemetry.repository';
import { ListQuery, Page } from '../../../domain/models/page';
import { QueryState } from '../../../application/state/query-state';
import { ListControlsComponent } from '../../../../device-configuration/presentation/components/list-controls/list-controls.component';
import { QueryFeedbackComponent } from '../../../../device-configuration/presentation/components/query-feedback/query-feedback.component';
import { TelemetryLabelPipe } from '../../state/labels';
import { DeviceRepository } from '../../../../device-configuration/domain/ports/device.repository';
import { DeviceDetail } from '../../../../device-configuration/domain/models/details';

@Component({
  selector: 'hg-device-telemetry-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    ListControlsComponent,
    QueryFeedbackComponent,
    TelemetryLabelPipe,
  ],
  templateUrl: './device-telemetry-detail.page.html',
  styleUrl: '../../telemetry-page.css',
})
export class DeviceTelemetryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly listMeasurements = inject(ListMeasurementsUseCase);
  private readonly getLatest = inject(GetLatestMeasurementUseCase);
  private readonly deviceRepository = inject(DeviceRepository);

  readonly deviceId = this.route.snapshot.paramMap.get('deviceId') ?? '';

  readonly measurementsState = new QueryState<Page<WaterMeasurement>>();
  readonly deviceDetail = signal<DeviceDetail | null>(null);
  readonly latestMeasurement = signal<WaterMeasurement | null>(null);
  readonly loadingDevice = signal(false);

  readonly columns = ['recordedAt', 'ph', 'temperature', 'source', 'validation'];

  query: MeasurementQuery = {
    page: 1,
    pageSize: 10,
    sortBy: 'recordedAt',
    sortDirection: 'desc',
  };

  readonly filters = inject(FormBuilder).nonNullable.group({
    source: '',
  });

  ngOnInit(): void {
    if (this.deviceId) {
      void this.loadDeviceInfo();
      void this.reload();
    }
  }

  async loadDeviceInfo(): Promise<void> {
    this.loadingDevice.set(true);
    try {
      const [deviceData, latest] = await Promise.all([
        this.deviceRepository.get(this.deviceId),
        this.getLatest.execute(this.deviceId),
      ]);
      this.deviceDetail.set(deviceData);
      this.latestMeasurement.set(latest);
    } catch {
      // Ignorar o registrar error no crítico
    } finally {
      this.loadingDevice.set(false);
    }
  }

  reload(): Promise<void> {
    return this.measurementsState.load((signal) =>
      this.listMeasurements.execute(this.deviceId, this.query, signal),
    );
  }

  change(query: ListQuery): void {
    this.query = { ...this.query, ...query };
    void this.reload();
  }

  sort(sort: Sort): void {
    this.change({
      ...this.query,
      sortBy: sort.active,
      sortDirection: sort.direction === 'desc' ? 'desc' : 'asc',
      page: 1,
    });
  }

  filter(): void {
    this.query = { ...this.query, ...this.filters.getRawValue(), page: 1 };
    void this.reload();
  }
}
