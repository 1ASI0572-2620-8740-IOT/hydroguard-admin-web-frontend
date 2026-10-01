import { Provider } from '@angular/core';
import { WorkGroupRepository } from './domain/ports/work-group.repository';
import { WorkGroupAxiosRepository } from './infrastructure/http/work-group-axios.repository';
import { ReservoirRepository } from './domain/ports/reservoir.repository';
import { ReservoirAxiosRepository } from './infrastructure/http/reservoir-axios.repository';
import { DeviceRepository } from './domain/ports/device.repository';
import { DeviceAxiosRepository } from './infrastructure/http/device-axios.repository';
import { OperatorProfileRepository } from './domain/ports/operator-profile.repository';
import { OperatorProfileAxiosRepository } from './infrastructure/http/operator-profile-axios.repository';
import { OperationalCatalogRepository } from './domain/ports/operational-catalog.repository';
import { OperationalCatalogAxiosRepository } from './infrastructure/http/operational-catalog-axios.repository';
export const provideDeviceConfiguration = (): Provider[] => [
  { provide: WorkGroupRepository, useClass: WorkGroupAxiosRepository },
  { provide: ReservoirRepository, useClass: ReservoirAxiosRepository },
  { provide: DeviceRepository, useClass: DeviceAxiosRepository },
  { provide: OperatorProfileRepository, useClass: OperatorProfileAxiosRepository },
  { provide: OperationalCatalogRepository, useClass: OperationalCatalogAxiosRepository },
];
