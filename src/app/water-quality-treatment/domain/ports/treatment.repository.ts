import { TreatmentPage, TreatmentProcessDetail, TreatmentQuery } from '../models/treatment';
export abstract class TreatmentRepository {
  abstract list(query: TreatmentQuery, signal?: AbortSignal): Promise<TreatmentPage>;
  abstract detail(id: string, signal?: AbortSignal): Promise<TreatmentProcessDetail>;
}
