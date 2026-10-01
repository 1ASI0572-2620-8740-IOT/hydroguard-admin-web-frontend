import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ListDevicesUseCase } from '../../../application/use-cases/list-devices.use-case';
import { Device } from '../../../domain/models/device';
import { DeviceQuery, ListQuery, Page } from '../../../domain/models/page';
import { QueryState } from '../../../application/state/query-state';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';
@Component({
  selector: 'hg-devices-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    ListControlsComponent,
    QueryFeedbackComponent,
    ConfigurationLabelPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './devices.page.html',
  styleUrl: '../../configuration-page.css',
})
export class DevicesPage implements OnInit {
  private readonly list = inject(ListDevicesUseCase);
  readonly state = new QueryState<Page<Device>>();
  readonly columns = [
    'serialNumber',
    'alias',
    'lifecycleStatus',
    'reservoirId',
    'availability',
    'operatingEnvironment',
    'configurationStatus',
  ];
  readonly statuses = [
    { value: 'ACTIVE_UNLINKED', label: 'Sin vincular' },
    { value: 'ACTIVE_UNASSIGNED', label: 'Sin responsable' },
    { value: 'ACTIVE_ASSIGNED', label: 'Asignado' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];
  query: DeviceQuery = { page: 1, pageSize: 10, sortBy: 'serialNumber', sortDirection: 'asc' };
  readonly filters = inject(FormBuilder).nonNullable.group({
    availability: '',
    operatingEnvironment: '',
    configurationStatus: '',
  });
  ngOnInit() {
    void this.reload();
  }
  reload() {
    return this.state.load((signal) => this.list.execute(this.query, signal));
  }
  change(query: ListQuery) {
    this.query = { ...this.query, ...query };
    void this.reload();
  }
  sort(sort: Sort) {
    this.change({
      ...this.query,
      sortBy: sort.active,
      sortDirection: sort.direction === 'desc' ? 'desc' : 'asc',
      page: 1,
    });
  }
  filter() {
    this.query = { ...this.query, ...this.filters.getRawValue(), page: 1 };
    void this.reload();
  }
}
