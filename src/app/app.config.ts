import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideDeviceConfiguration } from './device-configuration/configuration.providers';
import { provideOperationalMonitoring } from './operational-monitoring/monitoring.providers';
import { apiClient, AppHttpError } from './core/http/api-client';
import { AdminSessionStore } from './iam/application/state/admin-session.store';

import { routes } from './app.routes';
import { IamRepository } from './iam/domain/ports/iam.repository';
import { SessionRepository } from './iam/domain/ports/session.repository';
import { IamAxiosRepository } from './iam/infrastructure/http/iam-axios.repository';
import { SessionStorageRepository } from './iam/infrastructure/storage/session-storage.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideAnimationsAsync(),
    { provide: SessionRepository, useClass: SessionStorageRepository },
    { provide: IamRepository, useClass: IamAxiosRepository },
    ...provideDeviceConfiguration(),
    ...provideOperationalMonitoring(),
    provideAppInitializer(() => {
      const session = inject(AdminSessionStore);
      const router = inject(Router);
      apiClient.interceptors.response.use(
        (response) => response,
        (error: unknown) => {
          if (error instanceof AppHttpError && error.statusCode === 401 && session.session()) {
            session.clear();
            void router.navigate(['/login']);
          }
          return Promise.reject(error);
        },
      );
    }),
  ],
};
