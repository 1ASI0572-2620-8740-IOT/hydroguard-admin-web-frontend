import { inject, Injectable } from '@angular/core';
import { WorkGroupRepository } from '../../domain/ports/work-group.repository';
import { CreateWorkGroup } from '../../domain/models/work-group';
@Injectable({ providedIn: 'root' })
export class CreateWorkGroupUseCase {
  private readonly repository = inject(WorkGroupRepository);
  execute(request: CreateWorkGroup) {
    return this.repository.create({
      name: request.name.trim(),
      purpose: request.purpose.trim(),
      classification: request.classification.trim(),
    });
  }
}
