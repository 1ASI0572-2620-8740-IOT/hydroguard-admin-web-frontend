import { inject, Injectable } from '@angular/core';
import { TelemetryRepository, TelemetrySummaryQuery } from '../../domain/ports/telemetry.repository';

@Injectable({ providedIn: 'root' })
export class ListDeviceSummariesUseCase {
  private readonly repository = inject(TelemetryRepository);

  execute(query?: TelemetrySummaryQuery, signal?: AbortSignal) {
    return this.repository.listDeviceSummaries(query, signal);
  }
}
