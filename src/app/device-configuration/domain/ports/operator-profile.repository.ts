import { CreateOperatorProfile, OperatorProfile } from '../models/operator-profile';
import { OperatorProfileDetail } from '../models/details';
import { ListQuery, Page } from '../models/page';
export abstract class OperatorProfileRepository {
  abstract list(query: ListQuery, signal?: AbortSignal): Promise<Page<OperatorProfile>>;
  abstract get(id: string, signal?: AbortSignal): Promise<OperatorProfileDetail>;
  abstract create(request: CreateOperatorProfile): Promise<OperatorProfile>;
  abstract addAssignments(id: string, reservoirIds: ReadonlyArray<string>): Promise<void>;
  abstract closeAssignment(id: string): Promise<void>;
  abstract deactivate(id: string): Promise<void>;
}
