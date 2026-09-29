import { inject, Injectable } from '@angular/core';
import { FirstAccessCode } from '../../domain/models/first-access-code';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({
  providedIn: 'root',
})
export class GenerateFirstAccessCodeUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(operatorId: string): Promise<FirstAccessCode> {
    if (!operatorId) {
      throw new Error('Identificador de operario requerido.');
    }

    const account = await this.iamRepo.getOperatorById(operatorId);
    if (!account) {
      throw new Error('No se encontró la cuenta del operario.');
    }
    if (!account.isActive) {
      throw new Error('No se puede generar un código para una cuenta inactiva.');
    }

    const summary = await this.iamRepo.getOperatorAccessSummary(operatorId);

    if (!summary.hasProfile || !summary.operatorProfileId) {
      throw new Error(
        'Precondición no cumplida: El operario debe contar con un Perfil de Operario antes de generar el código de primer acceso.',
      );
    }

    if (!summary.hasGroup) {
      throw new Error(
        'Precondición no cumplida: El perfil del operario debe estar asociado a un Grupo de Trabajo.',
      );
    }

    if (summary.profileStatus !== 'PENDING_FIRST_ACCESS') {
      throw new Error(
        'Operación inválida: El código solo puede generarse mientras el perfil está pendiente del primer acceso.',
      );
    }

    if (!summary.hasActiveAssignments) {
      throw new Error(
        'Precondición no cumplida: El operario debe tener al menos una asignación activa de reservorio y dispositivo vinculado.',
      );
    }

    const currentCode = await this.iamRepo.getFirstAccessCode(
      operatorId,
      summary.operatorProfileId,
    );

    if (currentCode?.status === 'ACTIVE') {
      throw new Error(
        'El perfil ya tiene un código activo. Debe revocarlo antes de generar un reemplazo.',
      );
    }

    if (currentCode?.status === 'USED') {
      throw new Error('El código de primer acceso ya fue utilizado y no puede reemplazarse.');
    }

    return this.iamRepo.generateFirstAccessCode(operatorId, summary.operatorProfileId);
  }
}
