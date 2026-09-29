import { inject, Injectable } from '@angular/core';
import { CreateOperatorRequest } from '../../domain/models/create-operator.request';
import { OperatorAccount } from '../../domain/models/operator-account';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateOperatorAccountUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(request: CreateOperatorRequest): Promise<OperatorAccount> {
    if (!request.displayName || request.displayName.trim().length === 0) {
      throw new Error('El nombre completo del operario es obligatorio.');
    }
    if (!request.identifier || request.identifier.trim().length < 3) {
      throw new Error('El identificador de acceso debe tener al menos 3 caracteres.');
    }
    if (!request.password || request.password.length < 6) {
      throw new Error('La contraseña definitiva debe tener al menos 6 caracteres.');
    }

    return this.iamRepo.createOperator(request);
  }
}
