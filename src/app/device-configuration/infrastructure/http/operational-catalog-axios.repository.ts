import { Injectable } from '@angular/core';
import { apiClient } from '../../../core/http/api-client';
import { OperationalCatalogRepository } from '../../domain/ports/operational-catalog.repository';
import {
  OrganizationContextDto,
  OperationalOptionsDto,
  AvailablePairDto,
} from './configuration-api.dto';
import { mapPair } from './configuration-api.mapper';
@Injectable()
export class OperationalCatalogAxiosRepository implements OperationalCatalogRepository {
  async organization(signal?: AbortSignal) {
    const { data } = await apiClient.get<OrganizationContextDto>('/v1/organizations/current', {
      signal,
    });
    return { id: data.id, name: data.name, segment: data.segment };
  }
  async options(signal?: AbortSignal) {
    const { data } = await apiClient.get<OperationalOptionsDto>('/v1/operational-options', {
      signal,
    });
    return {
      groups: data.groups.map(({ id, name }) => ({ id, name })),
      reservoirs: data.reservoirs.map(({ id, name, groupId }) => ({ id, name, groupId })),
      operators: data.operators.map(({ id, name }) => ({ id, name })),
    };
  }
  async availablePairs(groupId: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<AvailablePairDto[]>('/v1/available-pairs', {
      params: { groupId },
      signal,
    });
    return data.map(mapPair);
  }
}
