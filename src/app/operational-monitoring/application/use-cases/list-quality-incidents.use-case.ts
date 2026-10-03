import { inject, Injectable } from '@angular/core';
import { MonitoringListQuery } from '../../domain/models/monitoring';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
@Injectable({ providedIn: 'root' })
export class ListQualityIncidentsUseCase {
  private readonly repository = inject(MonitoringRepository);
  execute(query: MonitoringListQuery, signal?: AbortSignal) {
    return this.repository.incidents(query, signal);
  }
}
