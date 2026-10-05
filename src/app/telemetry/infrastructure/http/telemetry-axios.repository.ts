import { Injectable } from '@angular/core';
import { apiClient, AppHttpError } from '../../../core/http/api-client';
import {
  MeasurementQuery,
  TelemetryRepository,
  TelemetrySummaryQuery,
} from '../../domain/ports/telemetry.repository';
import { DeviceTelemetrySummary, WaterMeasurement } from '../../domain/models/water-measurement';
import { Page } from '../../domain/models/page';
import { queryParams } from './query-params';
import { DeviceTelemetrySummaryDto, PageDto, WaterMeasurementDto } from './telemetry-api.dto';
import { mapDeviceSummary, mapMeasurement, mapPage } from './telemetry-api.mapper';

@Injectable()
export class TelemetryAxiosRepository implements TelemetryRepository {
  async listMeasurements(
    deviceId: string,
    query?: MeasurementQuery,
    signal?: AbortSignal,
  ): Promise<Page<WaterMeasurement>> {
    const { data } = await apiClient.get<PageDto<WaterMeasurementDto>>(
      `/v1/devices/${encodeURIComponent(deviceId)}/water-measurements`,
      {
        params: queryParams(query ?? {}),
        signal,
      },
    );
    return mapPage(data, mapMeasurement);
  }

  async getLatestMeasurement(
    deviceId: string,
    signal?: AbortSignal,
  ): Promise<WaterMeasurement | null> {
    try {
      const { data } = await apiClient.get<WaterMeasurementDto>(
        `/v1/devices/${encodeURIComponent(deviceId)}/water-measurements/latest`,
        { signal },
      );
      return data ? mapMeasurement(data) : null;
    } catch (error: unknown) {
      if (error instanceof AppHttpError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async listDeviceSummaries(
    query?: TelemetrySummaryQuery,
    signal?: AbortSignal,
  ): Promise<Page<DeviceTelemetrySummary>> {
    const { data } = await apiClient.get<PageDto<DeviceTelemetrySummaryDto>>(
      '/v1/devices/telemetry-summaries',
      {
        params: queryParams(query ?? {}),
        signal,
      },
    );
    return mapPage(data, mapDeviceSummary);
  }
}
