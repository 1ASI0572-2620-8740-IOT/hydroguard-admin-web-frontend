import { inject, Injectable } from '@angular/core';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
@Injectable({ providedIn: 'root' })
export class GetDeviceTraceabilityUseCase {
  private readonly repository = inject(MonitoringRepository);
  execute(deviceId: string, from?: string, to?: string, signal?: AbortSignal) {
    return this.repository.traceability(deviceId, from, to, signal);
  }
}
