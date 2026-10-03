import { Injectable } from '@angular/core';
import { apiClient } from '../../../core/http/api-client';
import {
  MonitoringListQuery,
  RegisterIncidentRequest,
  ReportRequest,
} from '../../domain/models/monitoring';
import { MonitoringRepository } from '../../domain/ports/monitoring.repository';
import {
  MonitoringOverviewDto,
  MonitoringPageDto,
  OperationalAlertDto,
  QualityIncidentDto,
  TraceabilityDetailDto,
  TraceabilityReportDto,
} from './monitoring-api.dto';
import {
  mapAlert,
  mapIncident,
  mapOverview,
  mapPage,
  mapReport,
  mapTraceability,
} from './monitoring-api.mapper';

const params = (query: MonitoringListQuery) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value != null));

@Injectable()
export class MonitoringAxiosRepository implements MonitoringRepository {
  async overview(signal?: AbortSignal) {
    const { data } = await apiClient.get<MonitoringOverviewDto>('/v1/monitoring/overview', {
      signal,
    });
    return mapOverview(data);
  }
  async alerts(query: MonitoringListQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<MonitoringPageDto<OperationalAlertDto>>(
      '/v1/monitoring/alerts',
      { params: params(query), signal },
    );
    return mapPage(data, mapAlert);
  }
  async acknowledgeAlert(id: string) {
    const { data } = await apiClient.patch<OperationalAlertDto>(
      `/v1/monitoring/alerts/${encodeURIComponent(id)}/status`,
      { status: 'ACKNOWLEDGED' },
    );
    return mapAlert(data);
  }
  async incidents(query: MonitoringListQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<MonitoringPageDto<QualityIncidentDto>>(
      '/v1/monitoring/incidents',
      { params: params(query), signal },
    );
    return mapPage(data, mapIncident);
  }
  async registerIncident(request: RegisterIncidentRequest) {
    const { data } = await apiClient.post<QualityIncidentDto>('/v1/monitoring/incidents', request);
    return mapIncident(data);
  }
  async traceability(deviceId: string, from?: string, to?: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<TraceabilityDetailDto>(
      `/v1/monitoring/devices/${encodeURIComponent(deviceId)}/traceability`,
      { params: { ...(from ? { from } : {}), ...(to ? { to } : {}) }, signal },
    );
    return mapTraceability(data);
  }
  async generateReport(request: ReportRequest) {
    const { data } = await apiClient.post<TraceabilityReportDto>(
      '/v1/monitoring/reports/generate',
      request,
    );
    return mapReport(data);
  }
}
