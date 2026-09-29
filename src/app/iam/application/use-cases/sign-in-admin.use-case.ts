import { inject, Injectable } from '@angular/core';
import { SignInRequest } from '../../domain/models/sign-in.request';
import { SignInResponse } from '../../domain/models/sign-in.response';
import { IamRepository } from '../../domain/ports/iam.repository';
import { AdminSessionStore } from '../state/admin-session.store';

@Injectable({
  providedIn: 'root',
})
export class SignInAdminUseCase {
  private readonly iamRepo = inject(IamRepository);
  private readonly sessionStore = inject(AdminSessionStore);

  async execute(request: SignInRequest): Promise<SignInResponse> {
    if (!request.identifier || !request.password) {
      throw new Error('Debe proporcionar correo y contraseña.');
    }

    const response = await this.iamRepo.signIn(request);

    if (response.role !== 'ADMINISTRATOR') {
      throw new Error(
        'Acceso denegado: Esta aplicación web es exclusiva para el Administrador. Los Operarios deben utilizar la aplicación móvil.',
      );
    }

    this.sessionStore.setSession(response);
    return response;
  }
}
