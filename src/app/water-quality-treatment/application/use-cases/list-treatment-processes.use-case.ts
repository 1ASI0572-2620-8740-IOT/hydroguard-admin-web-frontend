import { inject, Injectable } from '@angular/core';
import { TreatmentQuery } from '../../domain/models/treatment';
import { TreatmentRepository } from '../../domain/ports/treatment.repository';
@Injectable({ providedIn: 'root' })
export class ListTreatmentProcessesUseCase {
  private readonly repository = inject(TreatmentRepository);
  execute(query: TreatmentQuery, signal?: AbortSignal) {
    return this.repository.list(query, signal);
  }
}
