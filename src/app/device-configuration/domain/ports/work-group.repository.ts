import { CreateWorkGroup, WorkGroup } from '../models/work-group';
import { WorkGroupDetail } from '../models/details';
import { ListQuery, Page } from '../models/page';
export abstract class WorkGroupRepository {
  abstract list(query: ListQuery, signal?: AbortSignal): Promise<Page<WorkGroup>>;
  abstract get(id: string, signal?: AbortSignal): Promise<WorkGroupDetail>;
  abstract create(request: CreateWorkGroup): Promise<WorkGroup>;
  abstract deactivate(id: string): Promise<void>;
}
