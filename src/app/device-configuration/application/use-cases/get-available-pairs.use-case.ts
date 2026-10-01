import { inject, Injectable } from '@angular/core';
import { OperationalCatalogRepository } from '../../domain/ports/operational-catalog.repository';

@Injectable({ providedIn: 'root' })
export class GetAvailablePairsUseCase {
  private readonly repository = inject(OperationalCatalogRepository);
  execute(groupId: string, signal?: AbortSignal) {
    return this.repository.availablePairs(groupId, signal);
  }
}
