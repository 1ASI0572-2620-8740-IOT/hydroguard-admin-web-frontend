import { Injectable, inject } from '@angular/core';
import { TelemetryRepository } from '../../domain/ports/telemetry.repository';

@Injectable({ providedIn: 'root' })
export class GetDeviceSummaryUseCase {
  private readonly repository = inject(TelemetryRepository);

  execute(deviceId: string, signal?: AbortSignal) {
    return this.repository.getDeviceSummary(deviceId, signal);
  }
}
