import { inject, Injectable } from '@angular/core';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';
import { CreateOperatorProfile } from '../../domain/models/operator-profile';
@Injectable({ providedIn: 'root' })
export class CreateOperatorProfileUseCase {
  private readonly repository = inject(OperatorProfileRepository);
  execute(request: CreateOperatorProfile) {
    return this.repository.create(request);
  }
}
