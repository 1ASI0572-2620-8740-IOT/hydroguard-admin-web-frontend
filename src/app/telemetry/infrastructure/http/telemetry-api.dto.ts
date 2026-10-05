import {
  DeviceDto,
  PageDto,
} from '../../../device-configuration/infrastructure/http/configuration-api.dto';

export interface WaterMeasurementDto {
  id: string;
  deviceId: string;
  ph: number;
  temperature: number;
  measuredAt: string;
  source: 'DEVICE' | 'SIMULATOR';
}

export interface DeviceTelemetrySummaryDto {
  device: DeviceDto;
  latestMeasurement: WaterMeasurementDto | null;
  heartbeatIntervalSeconds: number;
}

export type { PageDto };
