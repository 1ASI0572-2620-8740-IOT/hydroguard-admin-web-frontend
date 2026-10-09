import { Provider } from '@angular/core';
import { TreatmentRepository } from './domain/ports/treatment.repository';
import { TreatmentAxiosRepository } from './infrastructure/http/treatment-axios.repository';
export const provideTreatment = (): Provider[] => [
  { provide: TreatmentRepository, useClass: TreatmentAxiosRepository },
];
