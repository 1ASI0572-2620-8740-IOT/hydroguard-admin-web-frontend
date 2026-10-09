import { inject, Injectable } from '@angular/core';
import { TreatmentRepository } from '../../domain/ports/treatment.repository';
@Injectable({ providedIn: 'root' })
export class GetTreatmentProcessDetailUseCase {
  private readonly repository = inject(TreatmentRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.detail(id, signal);
  }
}
