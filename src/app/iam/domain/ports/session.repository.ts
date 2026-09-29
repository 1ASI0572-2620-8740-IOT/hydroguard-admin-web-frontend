import { SignInResponse } from '../models/sign-in.response';

/**
 * Puerto para persistir y recuperar la sesión del Administrador en el cliente.
 * La implementación debe utilizar sessionStorage (nunca localStorage ni almacenar contraseñas).
 */
export abstract class SessionRepository {
  abstract saveSession(session: SignInResponse): void;
  abstract getSession(): SignInResponse | null;
  abstract clearSession(): void;
}
