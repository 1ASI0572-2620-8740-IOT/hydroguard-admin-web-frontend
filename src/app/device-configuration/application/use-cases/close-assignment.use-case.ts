import { inject, Injectable } from '@angular/core';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';

@Injectable({ providedIn: 'root' })
export class CloseAssignmentUseCase {
  private readonly repository = inject(OperatorProfileRepository);
  execute(id: string) {
    return this.repository.closeAssignment(id);
  }
}
