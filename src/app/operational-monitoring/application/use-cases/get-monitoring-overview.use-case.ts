import { inject, Injectable } from '@angular/core';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
@Injectable({ providedIn: 'root' })
export class GetMonitoringOverviewUseCase {
  private readonly repository = inject(MonitoringRepository);
  execute(signal?: AbortSignal) {
    return this.repository.overview(signal);
  }
}
