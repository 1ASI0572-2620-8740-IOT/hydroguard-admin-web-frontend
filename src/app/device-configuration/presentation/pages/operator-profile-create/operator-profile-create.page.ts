import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { FieldErrorComponent } from '../../components/field-error/field-error.component';

import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateOperatorProfileUseCase } from '../../../application/use-cases/create-operator-profile.use-case';
import { GetOperationalOptionsUseCase } from '../../../application/use-cases/get-operational-options.use-case';
import { GetAvailablePairsUseCase } from '../../../application/use-cases/get-available-pairs.use-case';
import { OperationalOptions } from '../../../domain/models/operational-catalog';
import { AvailablePair } from '../../../domain/models/assignment';
@Component({
  selector: 'hg-operator-profile-create-page',
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
  templateUrl: './operator-profile-create.page.html',
  styleUrl: '../../configuration-page.css',
})
export class OperatorProfileCreatePage implements OnInit {
  private readonly create = inject(CreateOperatorProfileUseCase);
  private readonly options = inject(GetOperationalOptionsUseCase);
  private readonly available = inject(GetAvailablePairsUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly actions = inject(PageActions);
  readonly state = new QueryState<OperationalOptions>();
  readonly pairs = new QueryState<ReadonlyArray<AvailablePair>>();
  readonly form = inject(FormBuilder).nonNullable.group({
    userId: [this.route.snapshot.queryParamMap.get('userId') ?? '', Validators.required],
    groupId: ['', Validators.required],
    reservoirIds: [[] as string[], Validators.required],
  });
  constructor() {
    this.form.controls.groupId.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.form.controls.reservoirIds.setValue([]);
        this.pairs.data.set(null);
        void this.loadPairs();
      });
  }
  ngOnInit() {
    void this.load();
  }
  load() {
    return this.state.load((signal) => this.options.execute(signal));
  }
  loadPairs() {
    const groupId = this.form.controls.groupId.value;
    return groupId
      ? this.pairs.load((signal) => this.available.execute(groupId, signal))
      : Promise.resolve();
  }
  async refresh() {
    await this.load();
    this.form.controls.reservoirIds.setValue([]);
    await this.loadPairs();
  }
  async submit() {
    if (
      this.form.invalid ||
      !this.state.data() ||
      this.pairs.loading() ||
      this.actions.submitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }
    await this.actions.run(
      'Crear perfil y asignaciones',
      async () => {
        const profile = await this.create.execute(this.form.getRawValue());
        await this.router.navigate(['/operator-profiles', profile.id]);
      },
      () => this.refresh(),
      'Se creará el perfil en el grupo seleccionado y se asignarán los dispositivos elegidos a este operario.',
      this.form,
      false,
    );
  }
}
