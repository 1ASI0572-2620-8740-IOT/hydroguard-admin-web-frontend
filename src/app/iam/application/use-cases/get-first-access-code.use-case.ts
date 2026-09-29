import { inject, Injectable } from '@angular/core';
import { FirstAccessCode } from '../../domain/models/first-access-code';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({ providedIn: 'root' })
export class GetFirstAccessCodeUseCase {
  private readonly iamRepo = inject(IamRepository);

  execute(operatorId: string, profileId?: string): Promise<FirstAccessCode | null> {
    if (!operatorId) {
      throw new Error('Identificador de operario requerido.');
    }
    return this.iamRepo.getFirstAccessCode(operatorId, profileId);
  }
}
