export type OperatingEnvironment = 'INTEGRAL_PRODUCT' | 'SIMULATION' | 'ACADEMIC_PROTOTYPE';
export type DeviceLifecycleStatus =
  'ACTIVE_UNLINKED' | 'ACTIVE_UNASSIGNED' | 'ACTIVE_ASSIGNED' | 'MAINTENANCE' | 'INACTIVE';
export type DeviceAvailability = 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'UNKNOWN';
export type DeviceCapability =
  'PH_SENSOR' | 'TEMPERATURE_SENSOR' | 'DOSING' | 'HEATING' | 'COOLING' | 'RELEASE_VALVE';
export type ConfigurationStatus = 'MISSING' | 'COMPATIBLE' | 'INCOMPATIBLE';
export interface Device {
  readonly id: string;
  readonly serialNumber: string;
  readonly alias: string;
  readonly deviceModel: string;
  readonly operatingEnvironment: OperatingEnvironment;
  readonly capabilities: ReadonlyArray<DeviceCapability>;
  readonly lifecycleStatus: DeviceLifecycleStatus;
  readonly availability: DeviceAvailability;
  readonly reservoirId: string | null;
  readonly lastCommunicationAt: string | null;
  readonly configurationStatus: ConfigurationStatus;
  readonly currentConfigurationVersion: number | null;
}
export interface CreateDevice {
  readonly serialNumber: string;
  readonly alias: string;
  readonly deviceModel: string;
  readonly operatingEnvironment: OperatingEnvironment;
  readonly capabilities: ReadonlyArray<DeviceCapability>;
}
