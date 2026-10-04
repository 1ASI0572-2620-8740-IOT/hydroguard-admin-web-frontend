import {
  DeviceStatusView,
  MonitoringOverview,
  MonitoringPage,
  OperationalAlert,
  QualityIncident,
  TraceabilityDetail,
  TraceabilityEvent,
  TraceabilityReport,
} from '../../domain/models/monitoring';
import {
  DeviceStatusViewDto,
  MonitoringOverviewDto,
  MonitoringPageDto,
  OperationalAlertDto,
  QualityIncidentDto,
  TraceabilityDetailDto,
  TraceabilityEventDto,
  TraceabilityReportDto,
} from './monitoring-api.dto';

export const mapDeviceStatus = (dto: DeviceStatusViewDto): DeviceStatusView => ({ ...dto });
export const mapAlert = (dto: OperationalAlertDto): OperationalAlert => ({
  ...dto,
  attendedAt: dto.attendedAt ?? null,
});
export const mapIncident = (dto: QualityIncidentDto): QualityIncident => ({
  ...dto,
  correlationId: dto.correlationId ?? null,
  closedAt: dto.closedAt ?? null,
});
export const mapEvent = (dto: TraceabilityEventDto): TraceabilityEvent => ({
  ...dto,
  cycleId: dto.cycleId ?? null,
  ph: dto.ph ?? null,
  temperature: dto.temperature ?? null,
});
export const mapPage = <TDto, TModel>(
  dto: MonitoringPageDto<TDto>,
  mapper: (item: TDto) => TModel,
): MonitoringPage<TModel> => ({
  items: dto.items.map(mapper),
  total: dto.total,
  page: dto.page,
  pageSize: dto.pageSize,
});
export const mapOverview = (dto: MonitoringOverviewDto): MonitoringOverview => ({
  ...dto,
  devices: dto.devices.map(mapDeviceStatus),
  recentAlerts: dto.recentAlerts.map(mapAlert),
});
export const mapTraceability = (dto: TraceabilityDetailDto): TraceabilityDetail => ({
  device: mapDeviceStatus(dto.device),
  events: dto.events.map(mapEvent),
});
export const mapReport = (dto: TraceabilityReportDto): TraceabilityReport => ({
  ...dto,
  events: dto.events.map(mapEvent),
});
