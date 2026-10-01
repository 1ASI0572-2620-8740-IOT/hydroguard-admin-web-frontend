import { inject, Injectable } from '@angular/core';
import { ReservoirRepository } from '../../domain/ports/reservoir.repository';
import { ListQuery } from '../../domain/models/page';
@Injectable({ providedIn: 'root' })
export class ListReservoirsUseCase {
  private readonly repository = inject(ReservoirRepository);
  execute(query: ListQuery, signal?: AbortSignal) {
    return this.repository.list(query, signal);
  }
}
