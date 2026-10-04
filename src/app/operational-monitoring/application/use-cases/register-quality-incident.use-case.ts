import { inject, Injectable } from '@angular/core';
import { RegisterIncidentRequest } from '../../domain/models/monitoring';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
@Injectable({ providedIn: 'root' })
export class RegisterQualityIncidentUseCase {
  private readonly repository = inject(MonitoringRepository);
  execute(request: RegisterIncidentRequest) {
    return this.repository.registerIncident(request);
  }
}
