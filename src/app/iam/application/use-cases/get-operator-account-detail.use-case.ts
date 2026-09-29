import { inject, Injectable } from '@angular/core';
import { OperatorAccessSummary } from '../../domain/models/operator-access-summary';
import { OperatorAccount } from '../../domain/models/operator-account';
import { IamRepository } from '../../domain/ports/iam.repository';

export interface OperatorAccountDetailResult {
  readonly account: OperatorAccount;
  readonly accessSummary: OperatorAccessSummary;
}

@Injectable({
  providedIn: 'root',
})
export class GetOperatorAccountDetailUseCase {
  private readonly iamRepo = inject(IamRepository);

  async execute(operatorId: string): Promise<OperatorAccountDetailResult> {
    if (!operatorId) {
      throw new Error('Identificador de operario requerido.');
    }

    const account = await this.iamRepo.getOperatorById(operatorId);

    if (!account) {
      throw new Error(`No se encontró la cuenta de operario con ID: ${operatorId}`);
    }

    const accessSummary = await this.iamRepo.getOperatorAccessSummary(operatorId);

    return {
      account,
      accessSummary,
    };
  }
}
