import { inject, Injectable } from '@angular/core';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';

@Injectable({ providedIn: 'root' })
export class CloseQualityIncidentUseCase {
  private readonly repository = inject(MonitoringRepository);

  execute(id: string) {
    return this.repository.closeIncident(id);
  }
}
