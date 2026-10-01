import { inject, Injectable } from '@angular/core';
import { WorkGroupRepository } from '../../domain/ports/work-group.repository';

@Injectable({ providedIn: 'root' })
export class DeactivateWorkGroupUseCase {
  private readonly repository = inject(WorkGroupRepository);
  execute(id: string) {
    return this.repository.deactivate(id);
  }
}
