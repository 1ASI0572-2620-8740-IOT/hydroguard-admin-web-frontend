import { OrganizationSegment } from './work-group';
export interface OrganizationContext {
  readonly id: string;
  readonly name: string;
  readonly segment: OrganizationSegment;
}
export interface CatalogOption {
  readonly id: string;
  readonly name: string;
}
export interface OperationalOptions {
  readonly groups: ReadonlyArray<CatalogOption>;
  readonly reservoirs: ReadonlyArray<CatalogOption & { readonly groupId: string }>;
  readonly operators: ReadonlyArray<CatalogOption>;
}
