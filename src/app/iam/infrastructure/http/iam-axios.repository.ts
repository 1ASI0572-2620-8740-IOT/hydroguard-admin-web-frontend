import { Injectable } from '@angular/core';
import { apiClient, AppHttpError } from '../../../core/http/api-client';
import { CreateOperatorRequest } from '../../domain/models/create-operator.request';
import { FirstAccessCode } from '../../domain/models/first-access-code';
import { OperatorAccessSummary } from '../../domain/models/operator-access-summary';
import { OperatorAccount } from '../../domain/models/operator-account';
import { RegisterOrganizationRequest } from '../../domain/models/register-organization.request';
import { SignInRequest } from '../../domain/models/sign-in.request';
import { SignInResponse } from '../../domain/models/sign-in.response';
import { IamRepository, OperatorFilter, OperatorPage } from '../../domain/ports/iam.repository';
import {
  FirstAccessCodeDto,
  OperatorAccessSummaryDto,
  OperatorPageDto,
  SignInResponseDto,
  UserAccountDto,
} from './iam-api.dto';
import {
  mapCreateOperatorRequestToDto,
  mapFirstAccessCodeDtoToDomain,
  mapOperatorAccessSummaryDtoToDomain,
  mapRegisterOrganizationRequestToDto,
  mapSignInResponseDtoToDomain,
  mapUserAccountDtoToDomain,
} from './iam-api.mapper';

/**
 * Adaptador único para el contrato del backend IAM.
 * El servidor mock implementa estas mismas rutas; no existe lógica alternativa en Angular.
 */
@Injectable({ providedIn: 'root' })
export class IamAxiosRepository implements IamRepository {
  private readonly client = apiClient;

  async registerOrganization(request: RegisterOrganizationRequest): Promise<void> {
    await this.client.post(
      '/v1/organization-registrations',
      mapRegisterOrganizationRequestToDto(request),
    );
  }

  async signIn(request: SignInRequest): Promise<SignInResponse> {
    const response = await this.client.post<SignInResponseDto>('/v1/authentication/sign-in', {
      identifier: request.identifier,
      password: request.password,
    });
    return mapSignInResponseDtoToDomain(response.data);
  }

  async signOut(sessionToken?: string): Promise<void> {
    await this.client.post(
      '/v1/authentication/sign-out',
      undefined,
      sessionToken ? { headers: { Authorization: `Bearer ${sessionToken}` } } : undefined,
    );
  }

  async findOperators(filter: OperatorFilter = {}): Promise<OperatorPage> {
    const response = await this.client.get<OperatorPageDto>('/v1/operators', {
      params: {
        searchTerm: filter.searchTerm || undefined,
        status: filter.status || undefined,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 10,
      },
    });

    return {
      items: response.data.items.map(mapUserAccountDtoToDomain),
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
    };
  }

  async getOperatorById(operatorId: string): Promise<OperatorAccount | null> {
    try {
      const response = await this.client.get<UserAccountDto>(`/v1/operators/${operatorId}`);
      return mapUserAccountDtoToDomain(response.data);
    } catch (error) {
      if (error instanceof AppHttpError && error.statusCode === 404) return null;
      throw error;
    }
  }

  async createOperator(request: CreateOperatorRequest): Promise<OperatorAccount> {
    const response = await this.client.post<UserAccountDto>(
      '/v1/operators',
      mapCreateOperatorRequestToDto(request),
    );
    return mapUserAccountDtoToDomain(response.data);
  }

  async deactivateOperator(operatorId: string): Promise<void> {
    await this.client.patch(`/v1/operators/${operatorId}/status`, { status: 'INACTIVE' });
  }

  async getOperatorAccessSummary(operatorId: string): Promise<OperatorAccessSummary> {
    const response = await this.client.get<OperatorAccessSummaryDto>(
      `/v1/operators/${operatorId}/access-summary`,
    );
    return mapOperatorAccessSummaryDtoToDomain(response.data);
  }

  async getFirstAccessCode(
    operatorId: string,
    profileId?: string,
  ): Promise<FirstAccessCode | null> {
    try {
      const response = await this.client.get<FirstAccessCodeDto>(
        `/v1/operators/${operatorId}/first-access-code`,
        { params: { operatorProfileId: profileId || undefined } },
      );
      return mapFirstAccessCodeDtoToDomain(response.data);
    } catch (error) {
      if (error instanceof AppHttpError && error.statusCode === 404) return null;
      throw error;
    }
  }

  async generateFirstAccessCode(operatorId: string, profileId: string): Promise<FirstAccessCode> {
    const response = await this.client.post<FirstAccessCodeDto>(
      `/v1/operators/${operatorId}/first-access-code`,
      { operatorProfileId: profileId },
    );
    return mapFirstAccessCodeDtoToDomain(response.data);
  }

  async revokeFirstAccessCode(codeId: string): Promise<void> {
    await this.client.post(`/v1/first-access-codes/${codeId}/revoke`);
  }
}
