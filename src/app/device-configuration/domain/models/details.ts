import { WorkGroup, GroupMember } from './work-group';
import { Reservoir } from './reservoir';
import { Device } from './device';
import { OperatorProfile } from './operator-profile';
import { Assignment } from './assignment';
import { ConfigurationVersion } from './configuration-version';
export interface WorkGroupDetail {
  readonly group: WorkGroup;
  readonly members: ReadonlyArray<GroupMember>;
  readonly reservoirs: ReadonlyArray<Reservoir>;
}
export interface ReservoirDetail {
  readonly reservoir: Reservoir;
  readonly groupName: string;
  readonly device: Device | null;
}
export interface DeviceDetail {
  readonly device: Device;
  readonly reservoirName: string | null;
  readonly responsibleProfileId: string | null;
}
export interface OperatorProfileDetail {
  readonly profile: OperatorProfile;
  readonly assignments: ReadonlyArray<Assignment>;
}
export interface ConfigurationVersions {
  readonly device: Device;
  readonly versions: ReadonlyArray<ConfigurationVersion>;
}
