import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { configurationPaginatorLabels } from '../../state/paginator-labels';
import { debounceTime } from 'rxjs';
import { ListQuery } from '../../../domain/models/page';
@Component({
  selector: 'hg-list-controls',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useFactory: configurationPaginatorLabels }],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  template: `<form [formGroup]="form" class="filters" (submit)="$event.preventDefault()">
      <mat-form-field appearance="outline"
        ><mat-label>Buscar</mat-label><input matInput formControlName="searchTerm" maxlength="120"
      /></mat-form-field>
      <mat-form-field appearance="outline"
        ><mat-label>Estado</mat-label
        ><mat-select formControlName="status"
          ><mat-option value="">Todos</mat-option>
          @for (option of statuses(); track option.value) {
            <mat-option [value]="option.value">{{ option.label }}</mat-option>
          }
        </mat-select></mat-form-field
      >
    </form>
    <mat-paginator
      [length]="total()"
      [pageIndex]="(query().page ?? 1) - 1"
      [pageSize]="query().pageSize ?? 10"
      [pageSizeOptions]="[5, 10, 25]"
      [disabled]="loading()"
      (page)="paginate($event)"
      aria-label="Paginación de resultados"
    />`,
  styles:
    '.filters { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 20px; } .filters mat-form-field { flex: 1; min-width: 180px; }',
})
export class ListControlsComponent {
  readonly query = input<ListQuery>({});
  readonly total = input(0);
  readonly loading = input(false);
  readonly statuses = input<ReadonlyArray<{ value: string; label: string }>>([
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
  ]);
  readonly changed = output<ListQuery>();
  readonly form = inject(FormBuilder).nonNullable.group({ searchTerm: '', status: '' });
  constructor() {
    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.changed.emit({ ...this.query(), ...this.form.getRawValue(), page: 1 });
      });
  }
  paginate(event: PageEvent) {
    this.changed.emit({ ...this.query(), page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}
