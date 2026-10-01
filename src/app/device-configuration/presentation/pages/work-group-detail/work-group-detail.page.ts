import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { QueryState } from '../../../application/state/query-state';
import { PageActions } from '../../state/page-actions';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ActionFeedbackComponent } from '../../components/action-feedback/action-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { WorkGroupDetail } from '../../../domain/models/details';
import { GetWorkGroupUseCase } from '../../../application/use-cases/get-work-group.use-case';
import { DeactivateWorkGroupUseCase } from '../../../application/use-cases/deactivate-work-group.use-case';
@Component({
  selector: 'hg-work-group-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    QueryFeedbackComponent,
    ActionFeedbackComponent,
    ConfigurationLabelPipe,
  ],
  providers: [PageActions],
  templateUrl: './work-group-detail.page.html',
  styleUrl: '../../configuration-page.css',
})
export class WorkGroupDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly actions = inject(PageActions);
  private readonly get = inject(GetWorkGroupUseCase);
  private readonly deactivate = inject(DeactivateWorkGroupUseCase);
  readonly state = new QueryState<WorkGroupDetail>();
  get id() {
    return this.route.snapshot.paramMap.get('groupId') ?? '';
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
      'Desactivar grupo',
      () => this.deactivate.execute(id),
      () => this.load(),
      'El grupo se conservará en el historial. Solo puede desactivarse cuando no tenga reservorios ni perfiles activos.',
    );
  }
}
