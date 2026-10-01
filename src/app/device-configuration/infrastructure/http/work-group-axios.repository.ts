import { Injectable } from '@angular/core';
import { queryParams } from './query-params';
import { apiClient } from '../../../core/http/api-client';
import { WorkGroupRepository } from '../../domain/ports/work-group.repository';
import { CreateWorkGroup } from '../../domain/models/work-group';
import { ListQuery } from '../../domain/models/page';
import { PageDto, WorkGroupDto, WorkGroupDetailDto } from './configuration-api.dto';
import { mapGroup, mapPage, mapReservoir } from './configuration-api.mapper';
@Injectable()
export class WorkGroupAxiosRepository implements WorkGroupRepository {
  async list(query: ListQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<PageDto<WorkGroupDto>>('/v1/groups', {
      params: queryParams(query),
      signal,
    });
    return mapPage(data, mapGroup);
  }
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<WorkGroupDetailDto>(
      '/v1/groups/' + encodeURIComponent(id),
      { signal },
    );
    return {
      group: mapGroup(data.group),
      members: data.members.map((item) => ({
        profileId: item.profileId,
        userId: item.userId,
        displayName: item.displayName,
        status: item.status,
      })),
      reservoirs: data.reservoirs.map(mapReservoir),
    };
  }
  async create(request: CreateWorkGroup) {
    const { data } = await apiClient.post<WorkGroupDto>('/v1/groups', {
      name: request.name,
      purpose: request.purpose,
      classification: request.classification,
    });
    return mapGroup(data);
  }
  async deactivate(id: string) {
    await apiClient.patch('/v1/groups/' + encodeURIComponent(id) + '/status', {
      status: 'INACTIVE',
    });
  }
}
