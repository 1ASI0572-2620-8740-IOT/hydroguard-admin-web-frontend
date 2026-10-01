import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { OperatorProfileDetail } from '../../../domain/models/details';
import { AvailablePair } from '../../../domain/models/assignment';
import { GetOperatorProfileUseCase } from '../../../application/use-cases/get-operator-profile.use-case';
import { GetAvailablePairsUseCase } from '../../../application/use-cases/get-available-pairs.use-case';
import { AddAssignmentsUseCase } from '../../../application/use-cases/add-assignments.use-case';
import { CloseAssignmentUseCase } from '../../../application/use-cases/close-assignment.use-case';
import { DeactivateOperatorProfileUseCase } from '../../../application/use-cases/deactivate-operator-profile.use-case';
import { AssignmentManagerComponent } from '../../components/assignment-manager/assignment-manager.component';
@Component({
  selector: 'hg-operator-profile-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    ConfigurationLabelPipe,
    AssignmentManagerComponent,
  ],
  providers: [PageActions],
  templateUrl: './operator-profile-detail.page.html',
  styleUrl: '../../configuration-page.css',
})
export class OperatorProfileDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly actions = inject(PageActions);
  private readonly get = inject(GetOperatorProfileUseCase);
  private readonly available = inject(GetAvailablePairsUseCase);
  private readonly add = inject(AddAssignmentsUseCase);
  private readonly close = inject(CloseAssignmentUseCase);
  private readonly deactivate = inject(DeactivateOperatorProfileUseCase);
  readonly state = new QueryState<OperatorProfileDetail>();
  readonly pairs = new QueryState<ReadonlyArray<AvailablePair>>();
  get id() {
    return this.route.snapshot.paramMap.get('profileId') ?? '';
  }
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.data.set(null);
      this.pairs.data.set(null);
      void this.load();
    });
  }
  async load() {
    const id = this.id;
    await this.state.load((signal) => this.get.execute(id, signal));
    if (id !== this.id) return;
    const profile = this.state.data()?.profile;
    if (profile?.status !== 'INACTIVE' && profile)
      await this.pairs.load((signal) => this.available.execute(profile.groupId, signal));
    else this.pairs.data.set([]);
  }
  addPairs(reservoirIds: ReadonlyArray<string>) {
    const id = this.id;
    return this.actions.run(
      'Agregar asignaciones',
      () => this.add.execute(id, reservoirIds),
      () => this.load(),
      'Los pares quedarán bajo responsabilidad exclusiva de este operario.',
    );
  }
  closePair(id: string) {
    return this.actions.run(
      'Cerrar asignación',
      () => this.close.execute(id),
      () => this.load(),
      'El par quedará sin responsable y conservará su historial. Si es la última asignación, se revocará cualquier código pendiente.',
    );
  }
  disable() {
    const id = this.id;
    return this.actions.run(
      'Desactivar perfil',
      () => this.deactivate.execute(id),
      () => this.load(),
      'Se cerrarán sus asignaciones activas y se revocarán los códigos pendientes. La cuenta y el historial se conservarán.',
    );
  }
}
