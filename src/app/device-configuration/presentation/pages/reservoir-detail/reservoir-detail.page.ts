import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { ReservoirDetail } from '../../../domain/models/details';
import { GetReservoirUseCase } from '../../../application/use-cases/get-reservoir.use-case';
import { DeactivateReservoirUseCase } from '../../../application/use-cases/deactivate-reservoir.use-case';
@Component({
  selector: 'hg-reservoir-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    ConfigurationLabelPipe,
  ],
  providers: [PageActions],
  templateUrl: './reservoir-detail.page.html',
  styleUrl: '../../configuration-page.css',
})
export class ReservoirDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly actions = inject(PageActions);
  private readonly get = inject(GetReservoirUseCase);
  private readonly deactivate = inject(DeactivateReservoirUseCase);
  readonly state = new QueryState<ReservoirDetail>();
  get id() {
    return this.route.snapshot.paramMap.get('reservoirId') ?? '';
  }
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.state.data.set(null);
      void this.load();
    });
  }
  load() {
    const id = this.id;
    return this.state.load((signal) => this.get.execute(id, signal));
  }
  disable() {
    const id = this.id;
    return this.actions.run(
      'Desactivar reservorio',
      () => this.deactivate.execute(id),
      () => this.load(),
      'Se conservará su historial. Primero deben cerrarse sus asignaciones y retirarse la vinculación con el dispositivo.',
    );
  }
}
