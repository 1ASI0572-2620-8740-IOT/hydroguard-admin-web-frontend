export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type IncidentType = 'QUALITY_INCIDENT' | 'MONITORING_LOSS';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'CLOSED';
export type ProcessState = 'READING' | 'CORRECTION' | 'WAITING' | 'READY' | 'FAILURE' | 'RELEASED';
export type StatusView = 'UPDATED' | 'OUTDATED';

export interface DeviceStatusView {
  readonly deviceId: string;
  readonly serialNumber: string;
  readonly alias: string;
  readonly reservoirName: string;
  readonly operatorName: string | null;
  readonly availability: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN';
  readonly processState: ProcessState;
  readonly statusView: StatusView;
  readonly ph: number | null;
  readonly temperature: number | null;
  readonly measuredAt: string | null;
  readonly activeAlertCount: number;
}

export interface OperationalAlert {
  readonly id: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
  readonly reservoirName: string;
  readonly severity: AlertSeverity;
  readonly description: string;
  readonly source: string;
  readonly status: AlertStatus;
  readonly createdAt: string;
  readonly attendedAt: string | null;
}

export interface QualityIncident {
  readonly id: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
  readonly reservoirName: string;
  readonly incidentType: IncidentType;
  readonly description: string;
  readonly status: IncidentStatus;
  readonly correlationId: string | null;
  readonly createdAt: string;
  readonly closedAt: string | null;
}

export interface TraceabilityEvent {
  readonly id: string;
  readonly deviceId: string;
  readonly correlationId: string;
  readonly cycleId: string | null;
  readonly eventType: string;
  readonly title: string;
  readonly description: string;
  readonly actor: string;
  readonly outcome: 'INFO' | 'SUCCESS' | 'WARNING' | 'FAILURE';
  readonly ph: number | null;
  readonly temperature: number | null;
  readonly occurredAt: string;
}

export interface MonitoringOverview {
  readonly totalDevices: number;
  readonly onlineDevices: number;
  readonly devicesRequiringAttention: number;
  readonly activeAlerts: number;
  readonly openIncidents: number;
  readonly devices: ReadonlyArray<DeviceStatusView>;
  readonly recentAlerts: ReadonlyArray<OperationalAlert>;
}

export interface TraceabilityDetail {
  readonly device: DeviceStatusView;
  readonly events: ReadonlyArray<TraceabilityEvent>;
}

export interface TraceabilityReport {
  readonly id: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
  readonly reservoirName: string;
  readonly from: string;
  readonly to: string;
  readonly generatedAt: string;
  readonly measurements: number;
  readonly correctionCycles: number;
  readonly alerts: number;
  readonly incidents: number;
  readonly releases: number;
  readonly events: ReadonlyArray<TraceabilityEvent>;
}

export interface MonitoringPage<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface MonitoringListQuery {
  readonly searchTerm?: string;
  readonly status?: string;
  readonly severity?: string;
  readonly type?: string;
  readonly deviceId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

export interface RegisterIncidentRequest {
  readonly deviceId: string;
  readonly incidentType: IncidentType;
  readonly description: string;
}

export interface ReportRequest {
  readonly deviceId: string;
  readonly from: string;
  readonly to: string;
}
