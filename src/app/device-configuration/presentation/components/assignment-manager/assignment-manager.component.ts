import { Component, effect, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { Assignment, AvailablePair } from '../../../domain/models/assignment';
import { ConfigurationLabelPipe } from '../../state/labels';
@Component({
  selector: 'hg-assignment-manager',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ConfigurationLabelPipe,
  ],
  templateUrl: './assignment-manager.component.html',
  styleUrl: '../../configuration-page.css',
})
export class AssignmentManagerComponent {
  readonly assignments = input.required<ReadonlyArray<Assignment>>();
  readonly pairs = input.required<ReadonlyArray<AvailablePair>>();
  readonly disabled = input(false);
  readonly active = input(true);
  readonly add = output<ReadonlyArray<string>>();
  readonly close = output<string>();
  readonly form = inject(FormBuilder).nonNullable.group({
    reservoirIds: [[] as string[], Validators.required],
  });
  constructor() {
    effect(() => {
      this.pairs();
      this.form.reset();
    });
  }
  submit() {
    if (this.form.invalid || this.disabled()) {
      this.form.markAllAsTouched();
      return;
    }
    this.add.emit(this.form.controls.reservoirIds.value);
  }
}
