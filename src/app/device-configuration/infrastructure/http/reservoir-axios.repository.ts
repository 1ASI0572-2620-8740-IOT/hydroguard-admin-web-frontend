import { Injectable } from '@angular/core';
import { queryParams } from './query-params';
import { apiClient } from '../../../core/http/api-client';
import { ReservoirRepository } from '../../domain/ports/reservoir.repository';
import { CreateReservoir } from '../../domain/models/reservoir';
import { ListQuery } from '../../domain/models/page';
import { PageDto, ReservoirDto, ReservoirDetailDto } from './configuration-api.dto';
import { mapDevice, mapPage, mapReservoir } from './configuration-api.mapper';
@Injectable()
export class ReservoirAxiosRepository implements ReservoirRepository {
  async list(query: ListQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<PageDto<ReservoirDto>>('/v1/reservoirs', {
      params: queryParams(query),
      signal,
    });
    return mapPage(data, mapReservoir);
  }
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<ReservoirDetailDto>(
      '/v1/reservoirs/' + encodeURIComponent(id),
      { signal },
    );
    return {
      reservoir: mapReservoir(data.reservoir),
      groupName: data.groupName,
      device: data.device ? mapDevice(data.device) : null,
    };
  }
  async create(request: CreateReservoir) {
    const { data } = await apiClient.post<ReservoirDto>('/v1/reservoirs', { ...request });
    return mapReservoir(data);
  }
  async deactivate(id: string) {
    await apiClient.patch('/v1/reservoirs/' + encodeURIComponent(id) + '/status', {
      status: 'INACTIVE',
    });
  }
}
