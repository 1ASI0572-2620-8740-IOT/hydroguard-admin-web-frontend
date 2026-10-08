import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ListMeasurementsUseCase } from '../../../application/use-cases/list-measurements.use-case';
import { GetDeviceSummaryUseCase } from '../../../application/use-cases/get-device-summary.use-case';
import { DeviceTelemetrySummary, WaterMeasurement } from '../../../domain/models/water-measurement';
import { MeasurementQuery } from '../../../domain/ports/telemetry.repository';
import { ListQuery, Page } from '../../../domain/models/page';
import { QueryState } from '../../../application/state/query-state';
import { QueryFeedbackComponent } from '../../../../device-configuration/presentation/components/query-feedback/query-feedback.component';
import { TelemetryLabelPipe } from '../../state/labels';

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
    MatInputModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressBarModule,
    QueryFeedbackComponent,
    TelemetryLabelPipe,
  ],
  templateUrl: './device-telemetry-detail.page.html',
  styleUrl: '../../telemetry-page.css',
})
export class DeviceTelemetryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly listMeasurements = inject(ListMeasurementsUseCase);
  private readonly getSummary = inject(GetDeviceSummaryUseCase);

  readonly deviceId = this.route.snapshot.paramMap.get('deviceId') ?? '';

  readonly measurementsState = new QueryState<Page<WaterMeasurement>>();
  readonly summaryState = new QueryState<DeviceTelemetrySummary>();

  readonly columns = ['recordedAt', 'ph', 'temperature', 'source'];

  query: MeasurementQuery = {
    page: 1,
    pageSize: 10,
    sortBy: 'measuredAt',
    sortDirection: 'desc',
  };

  readonly filters = inject(FormBuilder).nonNullable.group({
    source: '',
    from: '',
    to: '',
  });

  ngOnInit(): void {
    if (this.deviceId) {
      void this.refresh();
    }
  }

  refresh(): Promise<void[]> {
    return Promise.all([
      this.summaryState.load((signal) => this.getSummary.execute(this.deviceId, signal)),
      this.reload(),
    ]);
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

  paginate(event: PageEvent): void {
    this.change({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}
