export type FirstAccessCodeStatus = 'ACTIVE' | 'USED' | 'REVOKED';

export class FirstAccessCode {
  readonly id: string;
  readonly code: string;
  readonly status: FirstAccessCodeStatus;
  readonly operatorProfileId: string;
  readonly operatorAccountId: string;
  readonly generatedAt?: Date;
  readonly usedAt?: Date;
  readonly revokedAt?: Date;

  constructor(
    id: string,
    code: string,
    status: FirstAccessCodeStatus,
    operatorProfileId: string,
    operatorAccountId: string,
    generatedAt?: Date,
    usedAt?: Date,
    revokedAt?: Date,
  ) {
    this.id = id;
    this.code = code;
    this.status = status;
    this.operatorProfileId = operatorProfileId;
    this.operatorAccountId = operatorAccountId;
    this.generatedAt = generatedAt;
    this.usedAt = usedAt;
    this.revokedAt = revokedAt;
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isUsed(): boolean {
    return this.status === 'USED';
  }

  get isRevoked(): boolean {
    return this.status === 'REVOKED';
  }
}
