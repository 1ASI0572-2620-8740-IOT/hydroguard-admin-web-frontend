import { ResourceStatus } from './work-group';
export type ReservoirType = 'SUMP' | 'TANK' | 'RESERVOIR';
export interface Reservoir {
  readonly id: string;
  readonly groupId: string;
  readonly name: string;
  readonly code: string;
  readonly reservoirType: ReservoirType;
  readonly location: string;
  readonly capacityLiters: number | null;
  readonly status: ResourceStatus;
}
export interface CreateReservoir {
  readonly groupId: string;
  readonly name: string;
  readonly code: string;
  readonly reservoirType: ReservoirType;
  readonly location: string;
  readonly capacityLiters: number | null;
}
