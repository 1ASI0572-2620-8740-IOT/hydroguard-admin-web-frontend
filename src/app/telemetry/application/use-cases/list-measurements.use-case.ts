import { inject, Injectable } from '@angular/core';
import { MeasurementQuery, TelemetryRepository } from '../../domain/ports/telemetry.repository';

@Injectable({ providedIn: 'root' })
export class ListMeasurementsUseCase {
  private readonly repository = inject(TelemetryRepository);

  execute(deviceId: string, query?: MeasurementQuery, signal?: AbortSignal) {
    return this.repository.listMeasurements(deviceId, query, signal);
  }
}
