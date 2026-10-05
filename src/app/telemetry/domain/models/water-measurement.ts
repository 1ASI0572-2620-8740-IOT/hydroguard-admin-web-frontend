import { Device } from '../../../device-configuration/domain/models/device';

export type MeasurementSource = 'DEVICE' | 'SIMULATOR';

export interface WaterMeasurement {
  readonly id: string;
  readonly deviceId: string;
  readonly ph: number;
  readonly temperature: number;
  readonly recordedAt: string;
  readonly source: MeasurementSource;
}

export interface DeviceTelemetrySummary {
  readonly device: Device;
  readonly latestMeasurement: WaterMeasurement | null;
  readonly heartbeatIntervalSeconds: number;
}
