import { OrganizationSegment, ResourceStatus } from '../../domain/models/work-group';
import { ReservoirType } from '../../domain/models/reservoir';
import {
  OperatingEnvironment,
  DeviceAvailability,
  DeviceCapability,
  DeviceLifecycleStatus,
  ConfigurationStatus,
} from '../../domain/models/device';
import { OperatorProfileStatus } from '../../domain/models/operator-profile';
export interface WorkGroupDto {
  id: string;
  name: string;
  purpose: string;
  classification: string;
  segment: OrganizationSegment;
  status: ResourceStatus;
}
export interface ReservoirDto {
  id: string;
  groupId: string;
  name: string;
  code: string;
  reservoirType: ReservoirType;
  location: string;
  capacityLiters: number | null;
  status: ResourceStatus;
}
export interface DeviceDto {
  id: string;
  serialNumber: string;
  alias: string;
  deviceModel: string;
  operatingEnvironment: OperatingEnvironment;
  capabilities: DeviceCapability[];
  lifecycleStatus: DeviceLifecycleStatus;
  availability: DeviceAvailability;
  reservoirId: string | null;
  lastCommunicationAt: string | null;
  configurationStatus: ConfigurationStatus;
  currentConfigurationVersion: number | null;
}
export interface OperatorProfileDto {
  id: string;
  userId: string;
  groupId: string;
  displayName: string;
  groupName: string;
  status: OperatorProfileStatus;
}
export interface AvailablePairDto {
  reservoirId: string;
  reservoirName: string;
  deviceId: string;
  deviceSerialNumber: string;
}
export interface AssignmentDto extends AvailablePairDto {
  id: string;
  operatorProfileId: string;
  status: 'ACTIVE' | 'CLOSED';
  assignedAt: string;
  closedAt?: string;
}
export interface PageDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface WorkGroupDetailDto {
  group: WorkGroupDto;
  members: { profileId: string; userId: string; displayName: string; status: string }[];
  reservoirs: ReservoirDto[];
}
export interface ReservoirDetailDto {
  reservoir: ReservoirDto;
  groupName: string;
  device: DeviceDto | null;
}
export interface DeviceDetailDto {
  device: DeviceDto;
  reservoirName: string | null;
  responsibleProfileId: string | null;
}
export interface OperatorProfileDetailDto {
  profile: OperatorProfileDto;
  assignments: AssignmentDto[];
}
export interface ConfigurationVersionDto {
  id: string;
  deviceId: string;
  configurationVersion: number;
  status: 'DRAFT' | 'PUBLISHED';
  compatible: boolean;
  incompatibilityReasons?: string[];
  createdAt: string;
  publishedAt?: string;
  phMin: number;
  phMax: number;
  temperatureMin: number;
  temperatureMax: number;
  releaseMode: 'MANUAL' | 'AUTOMATIC';
}
export interface ConfigurationVersionsDto {
  device: DeviceDto;
  versions: ConfigurationVersionDto[];
}
export interface OrganizationContextDto {
  id: string;
  name: string;
  segment: OrganizationSegment;
}
export interface OperationalOptionsDto {
  groups: { id: string; name: string }[];
  reservoirs: { id: string; name: string; groupId: string }[];
  operators: { id: string; name: string }[];
}
