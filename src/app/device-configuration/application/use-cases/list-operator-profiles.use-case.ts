import { inject, Injectable } from '@angular/core';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';
import { ListQuery } from '../../domain/models/page';
@Injectable({ providedIn: 'root' })
export class ListOperatorProfilesUseCase {
  private readonly repository = inject(OperatorProfileRepository);
  execute(query: ListQuery, signal?: AbortSignal) {
    return this.repository.list(query, signal);
  }
}
