import { inject, Injectable } from '@angular/core';
import { ReportRequest } from '../../domain/models/monitoring';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
@Injectable({ providedIn: 'root' })
export class GenerateTraceabilityReportUseCase {
  private readonly repository = inject(MonitoringRepository);
  execute(request: ReportRequest) {
    return this.repository.generateReport(request);
  }
}
