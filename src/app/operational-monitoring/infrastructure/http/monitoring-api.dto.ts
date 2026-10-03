import {
  AlertSeverity,
  AlertStatus,
  IncidentStatus,
  IncidentType,
  ProcessState,
  StatusView,
} from '../../domain/models/monitoring';

export interface DeviceStatusViewDto {
  deviceId: string;
  serialNumber: string;
  alias: string;
  reservoirName: string;
  operatorName: string | null;
  availability: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN';
  processState: ProcessState;
  statusView: StatusView;
  ph: number | null;
  temperature: number | null;
  measuredAt: string | null;
  activeAlertCount: number;
}
export interface OperationalAlertDto {
  id: string;
  deviceId: string;
  deviceSerialNumber: string;
  reservoirName: string;
  severity: AlertSeverity;
  description: string;
  source: string;
  status: AlertStatus;
  createdAt: string;
  attendedAt?: string;
}
export interface QualityIncidentDto {
  id: string;
  deviceId: string;
  deviceSerialNumber: string;
  reservoirName: string;
  incidentType: IncidentType;
  description: string;
  status: IncidentStatus;
  correlationId?: string;
  createdAt: string;
  closedAt?: string;
}
export interface TraceabilityEventDto {
  id: string;
  deviceId: string;
  correlationId: string;
  cycleId?: string;
  eventType: string;
  title: string;
  description: string;
  actor: string;
  outcome: 'INFO' | 'SUCCESS' | 'WARNING' | 'FAILURE';
  ph?: number;
  temperature?: number;
  occurredAt: string;
}
export interface MonitoringOverviewDto {
  totalDevices: number;
  onlineDevices: number;
  devicesRequiringAttention: number;
  activeAlerts: number;
  openIncidents: number;
  devices: DeviceStatusViewDto[];
  recentAlerts: OperationalAlertDto[];
}
export interface MonitoringPageDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface TraceabilityDetailDto {
  device: DeviceStatusViewDto;
  events: TraceabilityEventDto[];
}
export interface TraceabilityReportDto {
  id: string;
  deviceId: string;
  deviceSerialNumber: string;
  reservoirName: string;
  from: string;
  to: string;
  generatedAt: string;
  measurements: number;
  correctionCycles: number;
  alerts: number;
  incidents: number;
  releases: number;
  events: TraceabilityEventDto[];
}
