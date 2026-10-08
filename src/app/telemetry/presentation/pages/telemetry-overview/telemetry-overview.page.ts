import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ListDeviceSummariesUseCase } from '../../../application/use-cases/list-device-summaries.use-case';
import { DeviceTelemetrySummary } from '../../../domain/models/water-measurement';
import { ListQuery, Page } from '../../../domain/models/page';
import { TelemetrySummaryQuery } from '../../../domain/ports/telemetry.repository';
import { QueryState } from '../../../application/state/query-state';
import { QueryFeedbackComponent } from '../../../../device-configuration/presentation/components/query-feedback/query-feedback.component';
import { TelemetryLabelPipe } from '../../state/labels';

@Component({
  selector: 'hg-telemetry-overview-page',
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
    MatTooltipModule,
    QueryFeedbackComponent,
    TelemetryLabelPipe,
  ],
  templateUrl: './telemetry-overview.page.html',
  styleUrl: '../../telemetry-page.css',
})
export class TelemetryOverviewPage implements OnInit {
  private readonly listSummaries = inject(ListDeviceSummariesUseCase);

  readonly state = new QueryState<Page<DeviceTelemetrySummary>>();

  readonly columns = [
    'serialNumber',
    'environment',
    'availability',
    'lastCommunication',
    'latestPh',
    'latestTemperature',
    'source',
    'actions',
  ];

  query: TelemetrySummaryQuery = {
    page: 1,
    pageSize: 10,
    sortBy: 'serialNumber',
    sortDirection: 'asc',
  };

  readonly filters = inject(FormBuilder).nonNullable.group({
    searchTerm: '',
    availability: '',
    operatingEnvironment: '',
  });

  ngOnInit(): void {
    void this.reload();
  }

  reload(): Promise<void> {
    return this.state.load((signal) => this.listSummaries.execute(this.query, signal));
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
