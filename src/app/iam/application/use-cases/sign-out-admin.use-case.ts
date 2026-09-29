import { inject, Injectable } from '@angular/core';
import { IamRepository } from '../../domain/ports/iam.repository';
import { AdminSessionStore } from '../state/admin-session.store';

@Injectable({
  providedIn: 'root',
})
export class SignOutAdminUseCase {
  private readonly iamRepo = inject(IamRepository);
  private readonly sessionStore = inject(AdminSessionStore);

  async execute(): Promise<void> {
    await this.iamRepo.signOut().catch(() => undefined);
    this.sessionStore.clear();
  }
}
