import { Injectable } from '@angular/core';
import { apiClient } from '../../../core/http/api-client';
import {
  TreatmentPage,
  TreatmentProcessDetail,
  TreatmentQuery,
} from '../../domain/models/treatment';
import { TreatmentRepository } from '../../domain/ports/treatment.repository';
const params = (query: TreatmentQuery) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value != null));
@Injectable()
export class TreatmentAxiosRepository implements TreatmentRepository {
  async list(query: TreatmentQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<TreatmentPage>('/v1/treatments', {
      params: params(query),
      signal,
    });
    return data;
  }
  async detail(id: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<TreatmentProcessDetail>(
      `/v1/treatments/${encodeURIComponent(id)}`,
      { signal },
    );
    return data;
  }
}
