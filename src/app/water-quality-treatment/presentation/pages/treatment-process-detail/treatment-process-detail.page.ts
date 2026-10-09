import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TreatmentQueryState } from '../../../application/state/treatment-query-state';
import { GetTreatmentProcessDetailUseCase } from '../../../application/use-cases/get-treatment-process-detail.use-case';
import { TreatmentProcessDetail } from '../../../domain/models/treatment';
import { TreatmentLabelPipe } from '../../state/treatment-label.pipe';

@Component({
  selector: 'hg-treatment-process-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TreatmentLabelPipe,
  ],
  templateUrl: './treatment-process-detail.page.html',
  styleUrl: '../../treatment-page.css',
})
export class TreatmentProcessDetailPage implements OnInit {
  private readonly get = inject(GetTreatmentProcessDetailUseCase);
  readonly processId = inject(ActivatedRoute).snapshot.paramMap.get('processId') ?? '';
  readonly state = new TreatmentQueryState<TreatmentProcessDetail>();
  ngOnInit(): void {
    void this.load();
  }
  load(): Promise<void> {
    return this.state.load((signal) => this.get.execute(this.processId, signal));
  }
}
