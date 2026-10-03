import { Provider } from '@angular/core';
import { MonitoringRepository } from './domain/ports/monitoring.repository';
import { MonitoringAxiosRepository } from './infrastructure/http/monitoring-axios.repository';
export const provideOperationalMonitoring = (): Provider[] => [
  { provide: MonitoringRepository, useClass: MonitoringAxiosRepository },
];
