import { WorkGroup } from '../../domain/models/work-group';
import { Reservoir } from '../../domain/models/reservoir';
import { Device } from '../../domain/models/device';
import { OperatorProfile } from '../../domain/models/operator-profile';
import { Assignment, AvailablePair } from '../../domain/models/assignment';
import { Page } from '../../domain/models/page';
import { ConfigurationVersion } from '../../domain/models/configuration-version';
import {
  AssignmentDto,
  AvailablePairDto,
  ConfigurationVersionDto,
  DeviceDto,
  OperatorProfileDto,
  PageDto,
  ReservoirDto,
  WorkGroupDto,
} from './configuration-api.dto';
export const mapGroup = (dto: WorkGroupDto): WorkGroup => ({
  id: dto.id,
  name: dto.name,
  purpose: dto.purpose,
  classification: dto.classification,
  segment: dto.segment,
  status: dto.status,
});
export const mapReservoir = (dto: ReservoirDto): Reservoir => ({
  id: dto.id,
  groupId: dto.groupId,
  name: dto.name,
  code: dto.code,
  reservoirType: dto.reservoirType,
  location: dto.location,
  capacityLiters: dto.capacityLiters,
  status: dto.status,
});
export const mapDevice = (dto: DeviceDto): Device => ({
  id: dto.id,
  serialNumber: dto.serialNumber,
  alias: dto.alias,
  deviceModel: dto.deviceModel,
  operatingEnvironment: dto.operatingEnvironment,
  capabilities: [...dto.capabilities],
  lifecycleStatus: dto.lifecycleStatus,
  availability: dto.availability,
  reservoirId: dto.reservoirId,
  lastCommunicationAt: dto.lastCommunicationAt,
  configurationStatus: dto.configurationStatus,
  currentConfigurationVersion: dto.currentConfigurationVersion,
});
export const mapProfile = (dto: OperatorProfileDto): OperatorProfile => ({
  id: dto.id,
  userId: dto.userId,
  groupId: dto.groupId,
  displayName: dto.displayName,
  groupName: dto.groupName,
  status: dto.status,
});
export const mapPair = (dto: AvailablePairDto): AvailablePair => ({
  reservoirId: dto.reservoirId,
  reservoirName: dto.reservoirName,
  deviceId: dto.deviceId,
  deviceSerialNumber: dto.deviceSerialNumber,
});
export const mapAssignment = (dto: AssignmentDto): Assignment => ({
  ...mapPair(dto),
  id: dto.id,
  operatorProfileId: dto.operatorProfileId,
  status: dto.status,
  assignedAt: dto.assignedAt,
  closedAt: dto.closedAt ?? null,
});
export const mapVersion = (dto: ConfigurationVersionDto): ConfigurationVersion => ({
  id: dto.id,
  deviceId: dto.deviceId,
  configurationVersion: dto.configurationVersion,
  status: dto.status,
  compatible: dto.compatible,
  incompatibilityReasons: dto.incompatibilityReasons ?? [],
  createdAt: dto.createdAt,
  publishedAt: dto.publishedAt ?? null,
  phMin: dto.phMin,
  phMax: dto.phMax,
  temperatureMin: dto.temperatureMin,
  temperatureMax: dto.temperatureMax,
  releaseMode: dto.releaseMode,
});
export const mapPage = <TDto, TModel>(
  dto: PageDto<TDto>,
  mapper: (item: TDto) => TModel,
): Page<TModel> => ({
  items: dto.items.map(mapper),
  total: dto.total,
  page: dto.page,
  pageSize: dto.pageSize,
});
