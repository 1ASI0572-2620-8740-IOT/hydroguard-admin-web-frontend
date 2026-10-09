import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TreatmentQueryState } from '../../../application/state/treatment-query-state';
import { ListTreatmentProcessesUseCase } from '../../../application/use-cases/list-treatment-processes.use-case';
import { TreatmentPage, TreatmentQuery } from '../../../domain/models/treatment';
import { TreatmentLabelPipe } from '../../state/treatment-label.pipe';

@Component({
  selector: 'hg-treatment-processes-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    TreatmentLabelPipe,
  ],
  templateUrl: './treatment-processes.page.html',
  styleUrl: '../../treatment-page.css',
})
export class TreatmentProcessesPage implements OnInit {
  private readonly list = inject(ListTreatmentProcessesUseCase);
  readonly state = new TreatmentQueryState<TreatmentPage>();
  readonly filters = inject(FormBuilder).nonNullable.group({ searchTerm: '', status: '' });
  query: TreatmentQuery = {
    page: 1,
    pageSize: 10,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  };
  ngOnInit(): void {
    void this.reload();
  }
  reload(): Promise<void> {
    return this.state.load((signal) => this.list.execute(this.query, signal));
  }
  applyFilters(): void {
    this.query = { ...this.query, ...this.filters.getRawValue(), page: 1 };
    void this.reload();
  }
  changePage(delta: number): void {
    this.query = { ...this.query, page: Math.max(1, (this.query.page ?? 1) + delta) };
    void this.reload();
  }
}
