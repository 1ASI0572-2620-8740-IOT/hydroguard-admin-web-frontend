export type MeasurementSource = 'DEVICE' | 'SIMULATOR';
export type TelemetryAvailability = 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN';
export type TelemetryOperatingEnvironment =
  'INTEGRAL_PRODUCT' | 'SIMULATION' | 'ACADEMIC_PROTOTYPE';

export interface WaterMeasurement {
  readonly id: string;
  readonly deviceId: string;
  readonly ph: number;
  readonly temperature: number;
  readonly recordedAt: string;
  readonly source: MeasurementSource;
}

export interface TelemetryDeviceSnapshot {
  readonly id: string;
  readonly serialNumber: string;
  readonly alias: string | null;
  readonly deviceModel: string;
  readonly operatingEnvironment: TelemetryOperatingEnvironment;
  readonly availability: TelemetryAvailability;
  readonly reservoirName: string | null;
  readonly lastCommunicationAt: string | null;
}

export interface DeviceTelemetrySummary {
  readonly device: TelemetryDeviceSnapshot;
  readonly latestMeasurement: WaterMeasurement | null;
}
