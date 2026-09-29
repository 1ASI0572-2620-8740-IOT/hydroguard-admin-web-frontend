import { CreateOperatorRequest } from '../../domain/models/create-operator.request';
import { FirstAccessCode, FirstAccessCodeStatus } from '../../domain/models/first-access-code';
import {
  OperatorAccessSummary,
  OperatorAssignmentSummary,
  OperatorProfileStatus,
} from '../../domain/models/operator-access-summary';
import { AccountStatus, OperatorAccount } from '../../domain/models/operator-account';
import { RegisterOrganizationRequest } from '../../domain/models/register-organization.request';
import { SignInResponse } from '../../domain/models/sign-in.response';
import {
  CreateUserRequestDto,
  FirstAccessCodeDto,
  OperatorAccessSummaryDto,
  OperatorAssignmentDto,
  RegisterOrganizationRequestDto,
  SignInResponseDto,
  UserAccountDto,
} from './iam-api.dto';

export const mapRegisterOrganizationRequestToDto = (
  request: RegisterOrganizationRequest,
): RegisterOrganizationRequestDto => ({
  organization: {
    name: request.organizationName,
    ruc: request.ruc,
    phone: request.phone,
    segment: request.segment,
  },
  administrator: {
    displayName: request.administratorName,
    email: request.administratorEmail,
    password: request.password,
  },
});

export const mapSignInResponseDtoToDomain = (dto: SignInResponseDto): SignInResponse => {
  const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

  return new SignInResponse(
    String(dto.id),
    dto.identifier,
    String(dto.organizationId),
    dto.token,
    dto.role,
    expiresAt,
  );
};

export const mapUserAccountDtoToDomain = (dto: UserAccountDto): OperatorAccount => {
  const status: AccountStatus = dto.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const createdAt = dto.createdAt ? new Date(dto.createdAt) : undefined;
  const updatedAt = dto.updatedAt ? new Date(dto.updatedAt) : undefined;

  return new OperatorAccount(
    String(dto.id),
    dto.displayName,
    dto.identifier,
    status,
    createdAt,
    updatedAt,
  );
};

export const mapCreateOperatorRequestToDto = (
  request: CreateOperatorRequest,
): CreateUserRequestDto => {
  return {
    displayName: request.displayName,
    identifier: request.identifier,
    password: request.password,
  };
};

export const mapOperatorAssignmentDtoToDomain = (
  dto: OperatorAssignmentDto,
): OperatorAssignmentSummary => {
  return {
    assignmentId: String(dto.assignmentId || dto.id || ''),
    reservoirId: String(dto.reservoirId || ''),
    reservoirName: dto.reservoirName || `Reservorio ${dto.reservoirId}`,
    deviceId: String(dto.deviceId || ''),
    deviceSerialNumber: dto.deviceSerialNumber || `DEV-${dto.deviceId}`,
    status: dto.status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
  };
};

export const mapOperatorAccessSummaryDtoToDomain = (
  dto: OperatorAccessSummaryDto,
): OperatorAccessSummary => {
  const assignments: OperatorAssignmentSummary[] = (dto.assignments || []).map(
    mapOperatorAssignmentDtoToDomain,
  );

  return new OperatorAccessSummary(
    String(dto.operatorAccountId),
    dto.operatorProfileId ? String(dto.operatorProfileId) : null,
    dto.profileStatus as OperatorProfileStatus | null,
    dto.groupId ? String(dto.groupId) : null,
    dto.groupName || null,
    assignments,
  );
};

export const mapFirstAccessCodeDtoToDomain = (dto: FirstAccessCodeDto): FirstAccessCode => {
  const status: FirstAccessCodeStatus =
    dto.status === 'USED' || dto.status === 'REVOKED' ? dto.status : 'ACTIVE';
  const operatorAccountId = String(dto.operatorAccountId);
  const operatorProfileId = String(dto.operatorProfileId || '');
  const generatedAt = dto.generatedAt ? new Date(dto.generatedAt) : undefined;
  const usedAt = dto.usedAt ? new Date(dto.usedAt) : undefined;
  const revokedAt = dto.revokedAt ? new Date(dto.revokedAt) : undefined;

  return new FirstAccessCode(
    String(dto.id),
    dto.code,
    status,
    operatorProfileId,
    operatorAccountId,
    generatedAt,
    usedAt,
    revokedAt,
  );
};
