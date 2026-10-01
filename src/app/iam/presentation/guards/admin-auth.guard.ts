import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionStore } from '../../application/state/admin-session.store';

/**
 * Guardia funcional que protege las rutas administrativas.
 * Permite el acceso únicamente si existe una sesión válida con rol ADMINISTRATOR.
 * Si no está autenticado, redirige inmediatamente a /login.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const sessionStore = inject(AdminSessionStore);
  const router = inject(Router);

  if (sessionStore.hasValidSession()) {
    return true;
  }

  sessionStore.clear();
  return router.createUrlTree(['/login']);
};
