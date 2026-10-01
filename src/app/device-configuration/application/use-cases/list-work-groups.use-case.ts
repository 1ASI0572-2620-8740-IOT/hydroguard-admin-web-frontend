import { inject, Injectable } from '@angular/core';
import { WorkGroupRepository } from '../../domain/ports/work-group.repository';
import { ListQuery } from '../../domain/models/page';
@Injectable({ providedIn: 'root' })
export class ListWorkGroupsUseCase {
  private readonly repository = inject(WorkGroupRepository);
  execute(query: ListQuery, signal?: AbortSignal) {
    return this.repository.list(query, signal);
  }
}
