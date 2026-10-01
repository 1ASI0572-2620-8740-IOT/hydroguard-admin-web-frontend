import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { notBlank, positiveNumber } from '../../state/form-validators';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { FieldErrorComponent } from '../../components/field-error/field-error.component';

import { CreateReservoirUseCase } from '../../../application/use-cases/create-reservoir.use-case';
import { GetOperationalOptionsUseCase } from '../../../application/use-cases/get-operational-options.use-case';
import { OperationalOptions } from '../../../domain/models/operational-catalog';
import { ReservoirType } from '../../../domain/models/reservoir';
@Component({
  selector: 'hg-reservoir-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    FieldErrorComponent,
  ],
  providers: [PageActions],
  templateUrl: './reservoir-create.page.html',
  styleUrl: '../../configuration-page.css',
})
export class ReservoirCreatePage implements OnInit {
  private readonly create = inject(CreateReservoirUseCase);
  private readonly options = inject(GetOperationalOptionsUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly actions = inject(PageActions);
  readonly state = new QueryState<OperationalOptions>();
  readonly form = inject(FormBuilder).nonNullable.group({
    groupId: [this.route.snapshot.queryParamMap.get('groupId') ?? '', Validators.required],
    name: ['', [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(120)]],
    code: ['', [Validators.required, notBlank, Validators.minLength(2), Validators.maxLength(40)]],
    reservoirType: ['TANK' as ReservoirType, Validators.required],
    location: [
      '',
      [Validators.required, notBlank, Validators.minLength(3), Validators.maxLength(250)],
    ],
    capacityLiters: inject(FormBuilder).control<number | null>(null, positiveNumber),
  });
  ngOnInit() {
    void this.load();
  }
  load() {
    return this.state.load((signal) => this.options.execute(signal));
  }
  async submit() {
    if (this.form.invalid || !this.state.data() || this.actions.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    await this.actions.run(
      'Registrar reservorio',
      async () => {
        const reservoir = await this.create.execute(this.form.getRawValue());
        await this.router.navigate(['/reservoirs', reservoir.id]);
      },
      () => this.load(),
      undefined,
      this.form,
      false,
    );
  }
}
