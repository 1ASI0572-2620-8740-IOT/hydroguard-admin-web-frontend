import { inject, Injectable } from '@angular/core';
import { RegisterOrganizationRequest } from '../../domain/models/register-organization.request';
import { IamRepository } from '../../domain/ports/iam.repository';

@Injectable({ providedIn: 'root' })
export class RegisterOrganizationUseCase {
  private readonly repository = inject(IamRepository);

  execute(request: RegisterOrganizationRequest): Promise<void> {
    return this.repository.registerOrganization(request);
  }
}
