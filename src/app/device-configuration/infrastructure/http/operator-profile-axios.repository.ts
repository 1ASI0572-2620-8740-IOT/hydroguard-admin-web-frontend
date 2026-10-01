import { Injectable } from '@angular/core';
import { queryParams } from './query-params';
import { apiClient } from '../../../core/http/api-client';
import { OperatorProfileRepository } from '../../domain/ports/operator-profile.repository';
import { CreateOperatorProfile } from '../../domain/models/operator-profile';
import { ListQuery } from '../../domain/models/page';
import { PageDto, OperatorProfileDto, OperatorProfileDetailDto } from './configuration-api.dto';
import { mapAssignment, mapPage, mapProfile } from './configuration-api.mapper';
@Injectable()
export class OperatorProfileAxiosRepository implements OperatorProfileRepository {
  async list(query: ListQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<PageDto<OperatorProfileDto>>('/v1/operator-profiles', {
      params: queryParams(query),
      signal,
    });
    return mapPage(data, mapProfile);
  }
  async get(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<OperatorProfileDetailDto>(
      '/v1/operator-profiles/' + encodeURIComponent(id),
      { signal },
    );
    return { profile: mapProfile(data.profile), assignments: data.assignments.map(mapAssignment) };
  }
  async create(request: CreateOperatorProfile) {
    const { data } = await apiClient.post<OperatorProfileDto>('/v1/operator-profiles', {
      userId: request.userId,
      groupId: request.groupId,
      reservoirIds: [...request.reservoirIds],
    });
    return mapProfile(data);
  }
  async addAssignments(id: string, reservoirIds: ReadonlyArray<string>) {
    await apiClient.post('/v1/operator-profiles/' + encodeURIComponent(id) + '/assignments', {
      reservoirIds: [...reservoirIds],
    });
  }
  async closeAssignment(id: string) {
    await apiClient.post('/v1/assignments/' + encodeURIComponent(id) + '/close');
  }
  async deactivate(id: string) {
    await apiClient.patch('/v1/operator-profiles/' + encodeURIComponent(id) + '/status', {
      status: 'INACTIVE',
    });
  }
}
