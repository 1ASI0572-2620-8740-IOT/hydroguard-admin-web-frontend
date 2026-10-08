export interface WaterMeasurementDto {
  id: string;
  deviceId: string;
  ph: number;
  temperature: number;
  measuredAt: string;
  source: 'DEVICE' | 'SIMULATOR';
}

export interface TelemetryDeviceDto {
  id: string;
  serialNumber: string;
  alias: string | null;
  deviceModel: string;
  operatingEnvironment: 'INTEGRAL_PRODUCT' | 'SIMULATION' | 'ACADEMIC_PROTOTYPE';
  availability: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN';
  reservoirName: string | null;
  lastCommunicationAt: string | null;
}

export interface DeviceTelemetrySummaryDto {
  device: TelemetryDeviceDto;
  latestMeasurement: WaterMeasurementDto | null;
}

export interface PageDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
