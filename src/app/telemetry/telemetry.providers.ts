import { Provider } from '@angular/core';
import { TelemetryRepository } from './domain/ports/telemetry.repository';
import { TelemetryAxiosRepository } from './infrastructure/http/telemetry-axios.repository';

export const provideTelemetry = (): Provider[] => [
  { provide: TelemetryRepository, useClass: TelemetryAxiosRepository },
];
