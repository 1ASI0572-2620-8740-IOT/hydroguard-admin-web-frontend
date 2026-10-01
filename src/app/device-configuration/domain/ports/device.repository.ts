import { CreateDevice, Device } from '../models/device';
import { DeviceDetail, ConfigurationVersions } from '../models/details';
import { DeviceQuery, Page } from '../models/page';
export abstract class DeviceRepository {
  abstract list(query: DeviceQuery, signal?: AbortSignal): Promise<Page<Device>>;
  abstract get(id: string, signal?: AbortSignal): Promise<DeviceDetail>;
  abstract create(request: CreateDevice): Promise<Device>;
  abstract link(id: string, reservoirId: string): Promise<void>;
  abstract unlink(id: string): Promise<void>;
  abstract deactivate(id: string): Promise<void>;
  abstract configurations(id: string, signal?: AbortSignal): Promise<ConfigurationVersions>;
}
