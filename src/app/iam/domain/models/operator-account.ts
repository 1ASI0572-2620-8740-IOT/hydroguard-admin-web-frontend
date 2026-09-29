export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export class OperatorAccount {
  readonly id: string;
  readonly displayName: string;
  readonly identifier: string;
  readonly status: AccountStatus;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(
    id: string,
    displayName: string,
    identifier: string,
    status: AccountStatus = 'ACTIVE',
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.displayName = displayName;
    this.identifier = identifier;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }
}
