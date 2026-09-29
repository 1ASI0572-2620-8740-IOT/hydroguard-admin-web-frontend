import { inject, Injectable } from '@angular/core';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({
  providedIn: 'root',
})
export class DeactivateOperatorAccountUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(operatorId: string): Promise<void> {
    if (!operatorId) {
      throw new Error('Identificador de operario requerido para la baja lógica.');
    }

    return this.iamRepo.deactivateOperator(operatorId);
  }
}
