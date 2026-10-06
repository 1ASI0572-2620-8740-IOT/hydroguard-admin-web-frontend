import { Injectable } from '@angular/core';
import { queryParams } from './query-params';
import { apiClient } from '../../../core/http/api-client';
import { DeviceRepository } from '../../domain/ports/device.repository';
import { CreateDevice } from '../../domain/models/device';
import { DeviceQuery } from '../../domain/models/page';
import {
  PageDto,
  DeviceDto,
  DeviceDetailDto,
  ConfigurationVersionsDto,
  RegisteredDeviceDto,
} from './configuration-api.dto';
import { mapDevice, mapPage, mapVersion } from './configuration-api.mapper';
@Injectable()
export class DeviceAxiosRepository implements DeviceRepository {
  async list(query: DeviceQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<PageDto<DeviceDto>>('/v1/devices', {
      params: queryParams(query),
      signal,
    });
    return mapPage(data, mapDevice);
  }
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<DeviceDetailDto>('/v1/devices/' + encodeURIComponent(id), {
      signal,
    });
    return {
      device: mapDevice(data.device),
      reservoirName: data.reservoirName,
      responsibleProfileId: data.responsibleProfileId,
    };
  }
  async create(request: CreateDevice) {
    const { data } = await apiClient.post<RegisteredDeviceDto>('/v1/devices', {
      ...request,
      capabilities: [...request.capabilities],
    });
    return { device: mapDevice(data.device), activationCredential: data.activationCredential };
  }
  async revokeIdentity(id: string) {
    await apiClient.post('/v1/device-identities/' + encodeURIComponent(id) + '/revoke');
  }
  async link(id: string, reservoirId: string) {
    await apiClient.post('/v1/devices/' + encodeURIComponent(id) + '/link', { reservoirId });
  }
  async unlink(id: string) {
    await apiClient.post('/v1/devices/' + encodeURIComponent(id) + '/unlink');
  }
  async deactivate(id: string) {
    await apiClient.patch('/v1/devices/' + encodeURIComponent(id) + '/status', {
      status: 'INACTIVE',
    });
  }
  async configurations(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<ConfigurationVersionsDto>(
      '/v1/devices/' + encodeURIComponent(id) + '/configurations',
      { signal },
    );
    return { device: mapDevice(data.device), versions: data.versions.map(mapVersion) };
  }
}
