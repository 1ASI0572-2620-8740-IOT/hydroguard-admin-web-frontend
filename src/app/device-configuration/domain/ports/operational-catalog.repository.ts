import { OperationalOptions, OrganizationContext } from '../models/operational-catalog';
import { AvailablePair } from '../models/assignment';
export abstract class OperationalCatalogRepository {
  abstract organization(signal?: AbortSignal): Promise<OrganizationContext>;
  abstract options(signal?: AbortSignal): Promise<OperationalOptions>;
  abstract availablePairs(
    groupId: string,
    signal?: AbortSignal,
  ): Promise<ReadonlyArray<AvailablePair>>;
}
