import { DeviceTelemetrySummary, WaterMeasurement } from '../../domain/models/water-measurement';
import { Page } from '../../domain/models/page';
import {
  DeviceTelemetrySummaryDto,
  PageDto,
  TelemetryDeviceDto,
  WaterMeasurementDto,
} from './telemetry-api.dto';

export const mapMeasurement = (dto: WaterMeasurementDto): WaterMeasurement => ({
  id: dto.id,
  deviceId: dto.deviceId,
  ph: dto.ph,
  temperature: dto.temperature,
  recordedAt: dto.measuredAt,
  source: dto.source,
});

export const mapTelemetryDevice = (dto: TelemetryDeviceDto) => ({
  id: dto.id,
  serialNumber: dto.serialNumber,
  alias: dto.alias,
  deviceModel: dto.deviceModel,
  operatingEnvironment: dto.operatingEnvironment,
  availability: dto.availability,
  reservoirName: dto.reservoirName,
  lastCommunicationAt: dto.lastCommunicationAt,
});

export const mapDeviceSummary = (dto: DeviceTelemetrySummaryDto): DeviceTelemetrySummary => ({
  device: mapTelemetryDevice(dto.device),
  latestMeasurement: dto.latestMeasurement ? mapMeasurement(dto.latestMeasurement) : null,
});

export const mapPage = <TInput, TOutput>(
  page: PageDto<TInput>,
  mapper: (item: TInput) => TOutput,
): Page<TOutput> => ({
  items: page.items.map(mapper),
  total: page.total,
  page: page.page,
  pageSize: page.pageSize,
});
