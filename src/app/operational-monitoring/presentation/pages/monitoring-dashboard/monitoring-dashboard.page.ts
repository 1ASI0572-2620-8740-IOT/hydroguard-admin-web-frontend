import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GetMonitoringOverviewUseCase } from '../../../application/use-cases/get-monitoring-overview.use-case';
import { MonitoringQueryState } from '../../../application/state/monitoring-query-state';
import { MonitoringOverview } from '../../../domain/models/monitoring';
import { MonitoringFeedbackComponent } from '../../components/monitoring-feedback/monitoring-feedback.component';
import { MonitoringLabelPipe } from '../../state/monitoring-label.pipe';

@Component({
  selector: 'hg-monitoring-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MonitoringFeedbackComponent,
    MonitoringLabelPipe,
  ],
  templateUrl: './monitoring-dashboard.page.html',
  styleUrl: '../../monitoring-page.css',
})
export class MonitoringDashboardPage implements OnInit {
  private readonly getOverview = inject(GetMonitoringOverviewUseCase);
  readonly state = new MonitoringQueryState<MonitoringOverview>();
  ngOnInit(): void {
    void this.reload();
  }
  reload(): Promise<void> {
    return this.state.load((signal) => this.getOverview.execute(signal));
  }
}
