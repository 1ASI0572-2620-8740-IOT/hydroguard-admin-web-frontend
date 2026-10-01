import { inject, Injectable } from '@angular/core';
import { ReservoirRepository } from '../../domain/ports/reservoir.repository';

@Injectable({ providedIn: 'root' })
export class DeactivateReservoirUseCase {
  private readonly repository = inject(ReservoirRepository);
  execute(id: string) {
    return this.repository.deactivate(id);
  }
}
