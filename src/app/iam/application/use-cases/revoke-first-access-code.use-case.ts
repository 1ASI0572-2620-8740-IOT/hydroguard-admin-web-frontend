import { inject, Injectable } from '@angular/core';
import { FirstAccessCode } from '../../domain/models/first-access-code';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({
  providedIn: 'root',
})
export class RevokeFirstAccessCodeUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(code: FirstAccessCode): Promise<void> {
    if (!code) {
      throw new Error('Código de acceso requerido.');
    }

    if (code.status !== 'ACTIVE') {
      throw new Error(
        `Operación inválida: Solo se pueden revocar códigos con estado 'ACTIVE'. El código actual está en estado '${code.status}'.`,
      );
    }

    return this.iamRepo.revokeFirstAccessCode(code.id);
  }
}
