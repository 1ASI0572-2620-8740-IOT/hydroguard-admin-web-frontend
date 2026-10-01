import { inject, Injectable } from '@angular/core';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';

@Injectable({ providedIn: 'root' })
export class AddAssignmentsUseCase {
  private readonly repository = inject(OperatorProfileRepository);
  execute(id: string, reservoirIds: ReadonlyArray<string>) {
    return this.repository.addAssignments(id, reservoirIds);
  }
}
