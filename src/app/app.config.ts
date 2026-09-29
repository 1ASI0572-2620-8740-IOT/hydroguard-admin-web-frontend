import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

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
  ],
};
