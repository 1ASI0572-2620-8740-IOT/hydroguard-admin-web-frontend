import { inject, Injectable } from '@angular/core';
import { WorkGroupRepository } from '../../domain/ports/work-group.repository';

@Injectable({ providedIn: 'root' })
export class GetWorkGroupUseCase {
  private readonly repository = inject(WorkGroupRepository);
  execute(id: string, signal?: AbortSignal) {
    return this.repository.get(id, signal);
  }
}
