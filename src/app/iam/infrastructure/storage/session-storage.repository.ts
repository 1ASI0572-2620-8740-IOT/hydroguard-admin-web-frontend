import { Injectable } from '@angular/core';
import { SignInResponse, UserRole } from '../../domain/models/sign-in.response';
import { SessionRepository } from '../../domain/ports/session.repository';

interface StoredSessionData {
  id: string;
  identifier: string;
  organizationId: string;
  token: string;
  role: UserRole;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionStorageRepository implements SessionRepository {
  private readonly STORAGE_KEY = 'hg_admin_session';

  private isStoredSessionData(value: unknown): value is StoredSessionData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Partial<StoredSessionData>;
    return (
      typeof data.id === 'string' &&
      typeof data.identifier === 'string' &&
      typeof data.organizationId === 'string' &&
      typeof data.token === 'string' &&
      (data.role === 'ADMINISTRATOR' || data.role === 'OPERATOR') &&
      (data.expiresAt === undefined || typeof data.expiresAt === 'string')
    );
  }

  saveSession(session: SignInResponse): void {
    try {
      const data: StoredSessionData = {
        id: session.id,
        identifier: session.identifier,
        organizationId: session.organizationId,
        token: session.token,
        role: session.role,
        expiresAt: session.expiresAt ? session.expiresAt.toISOString() : undefined,
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar la sesión en sessionStorage', error);
    }
  }

  getSession(): SignInResponse | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;

      const data: unknown = JSON.parse(raw);
      if (!this.isStoredSessionData(data)) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
      return new SignInResponse(
        data.id,
        data.identifier,
        data.organizationId,
        data.token,
        data.role,
        expiresAt,
      );
    } catch {
      return null;
    }
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error al limpiar la sesión en sessionStorage', error);
    }
  }
}
