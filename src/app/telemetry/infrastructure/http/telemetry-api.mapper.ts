import { mapDevice } from '../../../device-configuration/infrastructure/http/configuration-api.mapper';
import { PageDto } from '../../../device-configuration/infrastructure/http/configuration-api.dto';
import { DeviceTelemetrySummary, WaterMeasurement } from '../../domain/models/water-measurement';
import { Page } from '../../domain/models/page';
import { DeviceTelemetrySummaryDto, WaterMeasurementDto } from './telemetry-api.dto';

export const mapMeasurement = (dto: WaterMeasurementDto): WaterMeasurement => ({
  id: dto.id,
  deviceId: dto.deviceId,
  ph: dto.ph,
  temperature: dto.temperature,
  recordedAt: dto.recordedAt,
  source: dto.source,
});

export const mapDeviceSummary = (dto: DeviceTelemetrySummaryDto): DeviceTelemetrySummary => ({
  device: mapDevice(dto.device),
  latestMeasurement: dto.latestMeasurement ? mapMeasurement(dto.latestMeasurement) : null,
  heartbeatIntervalSeconds: dto.heartbeatIntervalSeconds,
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
