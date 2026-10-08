import { inject, Injectable } from '@angular/core';
import { TelemetryRepository } from '../../domain/ports/telemetry.repository';

@Injectable({ providedIn: 'root' })
export class GetLatestMeasurementUseCase {
  private readonly repository = inject(TelemetryRepository);

  execute(deviceId: string, signal?: AbortSignal) {
    return this.repository.getLatestMeasurement(deviceId, signal);
  }
}
