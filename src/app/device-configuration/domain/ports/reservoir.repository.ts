import { CreateReservoir, Reservoir } from '../models/reservoir';
import { ReservoirDetail } from '../models/details';
import { ListQuery, Page } from '../models/page';
export abstract class ReservoirRepository {
  abstract list(query: ListQuery, signal?: AbortSignal): Promise<Page<Reservoir>>;
  abstract get(id: string, signal?: AbortSignal): Promise<ReservoirDetail>;
  abstract create(request: CreateReservoir): Promise<Reservoir>;
  abstract deactivate(id: string): Promise<void>;
}
