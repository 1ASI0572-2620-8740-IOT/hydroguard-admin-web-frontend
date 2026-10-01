import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';

import { ListReservoirsUseCase } from '../../../application/use-cases/list-reservoirs.use-case';
import { Reservoir } from '../../../domain/models/reservoir';
import { ListQuery, Page } from '../../../domain/models/page';
import { QueryState } from '../../../application/state/query-state';
import { ListControlsComponent } from '../../components/list-controls/list-controls.component';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';
@Component({
  selector: 'hg-reservoirs-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    ListControlsComponent,
    QueryFeedbackComponent,
    ConfigurationLabelPipe,
  ],
  templateUrl: './reservoirs.page.html',
  styleUrl: '../../configuration-page.css',
})
export class ReservoirsPage implements OnInit {
  private readonly list = inject(ListReservoirsUseCase);
  readonly state = new QueryState<Page<Reservoir>>();
  readonly columns = ['name', 'code', 'location', 'reservoirType', 'status'];
  readonly statuses = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ];
  query: ListQuery = { page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc' };

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
}
