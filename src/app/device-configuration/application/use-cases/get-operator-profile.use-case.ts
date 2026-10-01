import { inject, Injectable } from '@angular/core';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';

@Injectable({ providedIn: 'root' })
export class GetOperatorProfileUseCase {
  private readonly repository = inject(OperatorProfileRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
}
