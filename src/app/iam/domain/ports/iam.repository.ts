import { CreateOperatorRequest } from '../models/create-operator.request';
import { FirstAccessCode } from '../models/first-access-code';
import { OperatorAccessSummary } from '../models/operator-access-summary';
import { OperatorAccount } from '../models/operator-account';
import { RegisterOrganizationRequest } from '../models/register-organization.request';
import { SignInRequest } from '../models/sign-in.request';
import { SignInResponse } from '../models/sign-in.response';

export interface OperatorFilter {
  readonly searchTerm?: string;
  readonly status?: 'ACTIVE' | 'INACTIVE';
  readonly page?: number;
  readonly pageSize?: number;
}

export interface OperatorPage {
  readonly items: ReadonlyArray<OperatorAccount>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Puerto para las operaciones remotas de IAM.
 * No depende de Axios, Angular ni frameworks HTTP.
 */
export abstract class IamRepository {
  abstract registerOrganization(request: RegisterOrganizationRequest): Promise<void>;
  abstract signIn(request: SignInRequest): Promise<SignInResponse>;
  abstract signOut(sessionToken?: string): Promise<void>;
  abstract findOperators(filter?: OperatorFilter): Promise<OperatorPage>;
  abstract getOperatorById(operatorId: string): Promise<OperatorAccount | null>;
  abstract createOperator(request: CreateOperatorRequest): Promise<OperatorAccount>;
  abstract deactivateOperator(operatorId: string): Promise<void>;
  abstract getOperatorAccessSummary(operatorId: string): Promise<OperatorAccessSummary>;
  abstract getFirstAccessCode(
    operatorId: string,
    profileId?: string,
  ): Promise<FirstAccessCode | null>;
  abstract generateFirstAccessCode(operatorId: string, profileId: string): Promise<FirstAccessCode>;
  abstract revokeFirstAccessCode(codeId: string): Promise<void>;
}
