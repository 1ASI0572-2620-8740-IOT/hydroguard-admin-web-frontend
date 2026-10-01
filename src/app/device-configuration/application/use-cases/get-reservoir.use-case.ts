import { inject, Injectable } from '@angular/core';
import { ReservoirRepository } from '../../domain/ports/reservoir.repository';

@Injectable({ providedIn: 'root' })
export class GetReservoirUseCase {
  private readonly repository = inject(ReservoirRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
}
