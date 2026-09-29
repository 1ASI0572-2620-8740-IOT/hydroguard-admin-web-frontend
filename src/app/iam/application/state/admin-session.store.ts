import { computed, inject, Injectable, signal } from '@angular/core';
import { SignInResponse } from '../../domain/models/sign-in.response';
import { SessionRepository } from '../../domain/ports/session.repository';

@Injectable({
  providedIn: 'root',
})
export class AdminSessionStore {
  private readonly sessionRepo = inject(SessionRepository);

  private readonly _session = signal<SignInResponse | null>(this.restoreSession());

  readonly session = this._session.asReadonly();

  readonly isAuthenticated = computed(() => {
    const current = this._session();
    if (!current || !current.token) return false;
    if (current.role !== 'ADMINISTRATOR') return false;
    if (current.expiresAt) {
      const expirationTime = new Date(current.expiresAt).getTime();
      if (!Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
        return false;
      }
    }
    return true;
  });

  readonly adminIdentifier = computed(() => this._session()?.identifier ?? null);

  private restoreSession(): SignInResponse | null {
    const session = this.sessionRepo.getSession();
    if (!session?.expiresAt) return session;
    if (session.expiresAt.getTime() > Date.now()) return session;
    this.sessionRepo.clearSession();
    return null;
  }

  setSession(session: SignInResponse): void {
    if (session.role !== 'ADMINISTRATOR') {
      throw new Error('Solo los usuarios con rol ADMINISTRATOR pueden ingresar.');
    }
    if (!session.token.trim()) {
      throw new Error('La respuesta de autenticación no contiene un token válido.');
    }
    if (!session.organizationId.trim()) {
      throw new Error('La respuesta de autenticación no identifica la empresa administrada.');
    }
    this._session.set(session);
    this.sessionRepo.saveSession(session);
  }

  clear(): void {
    this._session.set(null);
    this.sessionRepo.clearSession();
  }
}
