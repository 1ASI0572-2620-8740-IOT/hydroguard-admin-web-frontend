import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { QueryState } from '../../../application/state/query-state';
import { QueryFeedbackComponent } from '../../components/query-feedback/query-feedback.component';
import { ConfigurationLabelPipe } from '../../state/labels';

import { DatePipe } from '@angular/common';
import { ConfigurationVersions } from '../../../domain/models/details';
import { GetConfigurationVersionsUseCase } from '../../../application/use-cases/get-configuration-versions.use-case';
@Component({
  selector: 'hg-configuration-versions-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, QueryFeedbackComponent, ConfigurationLabelPipe, DatePipe],
  templateUrl: './configuration-versions.page.html',
  styleUrl: '../../configuration-page.css',
})
export class ConfigurationVersionsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly get = inject(GetConfigurationVersionsUseCase);
  readonly state = new QueryState<ConfigurationVersions>();
  get id() {
    return this.route.snapshot.paramMap.get('deviceId') ?? '';
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
}
