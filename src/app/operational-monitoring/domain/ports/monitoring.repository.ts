import {
  MonitoringListQuery,
  MonitoringOverview,
  MonitoringPage,
  OperationalAlert,
  QualityIncident,
  RegisterIncidentRequest,
  ReportRequest,
  TraceabilityDetail,
  TraceabilityReport,
} from '../models/monitoring';

export abstract class MonitoringRepository {
  abstract overview(signal?: AbortSignal): Promise<MonitoringOverview>;
  abstract alerts(
    query: MonitoringListQuery,
    signal?: AbortSignal,
  ): Promise<MonitoringPage<OperationalAlert>>;
  abstract acknowledgeAlert(id: string): Promise<OperationalAlert>;
  abstract incidents(
    query: MonitoringListQuery,
    signal?: AbortSignal,
  ): Promise<MonitoringPage<QualityIncident>>;
  abstract registerIncident(request: RegisterIncidentRequest): Promise<QualityIncident>;
  abstract closeIncident(id: string): Promise<QualityIncident>;
  abstract traceability(
    deviceId: string,
    from?: string,
    to?: string,
    signal?: AbortSignal,
  ): Promise<TraceabilityDetail>;
  abstract generateReport(request: ReportRequest): Promise<TraceabilityReport>;
}
