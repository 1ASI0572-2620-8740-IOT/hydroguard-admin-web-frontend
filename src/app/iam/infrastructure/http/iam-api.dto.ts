/** DTOs del contrato público del backend IAM. El mock expone exactamente este contrato. */

export interface SignInRequestDto {
  username?: string;
  identifier?: string;
  password: string;
}

export interface SignInResponseDto {
  id: string;
  identifier: string;
  organizationId: string;
  token: string;
  role: 'ADMINISTRATOR' | 'OPERATOR';
  expiresAt?: string;
}

export interface RegisterOrganizationRequestDto {
  organization: {
    name: string;
    ruc: string;
    phone: string;
    segment: 'HYDROPONIC' | 'TEXTILE';
  };
  administrator: {
    displayName: string;
    email: string;
    password: string;
  };
}

export interface UserAccountDto {
  id: string;
  displayName: string;
  identifier: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface OperatorPageDto {
  items: UserAccountDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserRequestDto {
  displayName: string;
  identifier: string;
  password: string;
}

export interface OperatorAssignmentDto {
  id?: string | number;
  assignmentId?: string;
  operatorProfileId?: string;
  reservoirId: string;
  reservoirName?: string;
  deviceId: string;
  deviceSerialNumber?: string;
  status: 'ACTIVE' | 'CLOSED';
}

export interface OperatorAccessSummaryDto {
  operatorAccountId: string;
  operatorProfileId: string | null;
  profileStatus: 'PENDING_FIRST_ACCESS' | 'ACTIVE' | 'INACTIVE' | null;
  groupId: string | null;
  groupName: string | null;
  assignments: OperatorAssignmentDto[];
}

export interface FirstAccessCodeDto {
  id: string;
  code: string;
  status: 'ACTIVE' | 'USED' | 'REVOKED';
  operatorProfileId: string;
  operatorAccountId: string;
  generatedAt?: string;
  usedAt?: string;
  revokedAt?: string;
}
