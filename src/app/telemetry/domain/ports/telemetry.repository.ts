import { DeviceTelemetrySummary, WaterMeasurement } from '../models/water-measurement';
import { ListQuery, Page } from '../models/page';

export interface MeasurementQuery extends ListQuery {
  readonly from?: string;
  readonly to?: string;
  readonly source?: string;
}

export interface TelemetrySummaryQuery extends ListQuery {
  readonly availability?: string;
  readonly operatingEnvironment?: string;
}

export abstract class TelemetryRepository {
  abstract listMeasurements(
    deviceId: string,
    query?: MeasurementQuery,
    signal?: AbortSignal,
  ): Promise<Page<WaterMeasurement>>;

  abstract getLatestMeasurement(
    deviceId: string,
    signal?: AbortSignal,
  ): Promise<WaterMeasurement | null>;

  abstract listDeviceSummaries(
    query?: TelemetrySummaryQuery,
    signal?: AbortSignal,
  ): Promise<Page<DeviceTelemetrySummary>>;

  abstract getDeviceSummary(
    deviceId: string,
    signal?: AbortSignal,
  ): Promise<DeviceTelemetrySummary>;
}
