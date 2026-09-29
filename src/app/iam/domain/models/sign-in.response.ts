export type UserRole = 'ADMINISTRATOR' | 'OPERATOR';

export class SignInResponse {
  readonly id: string;
  readonly identifier: string;
  readonly organizationId: string;
  readonly token: string;
  readonly role: UserRole;
  readonly expiresAt?: Date;

  constructor(
    id: string,
    identifier: string,
    organizationId: string,
    token: string,
    role: UserRole,
    expiresAt?: Date,
  ) {
    this.id = id;
    this.identifier = identifier;
    this.organizationId = organizationId;
    this.token = token;
    this.role = role;
    this.expiresAt = expiresAt;
  }

  isAdmin(): boolean {
    return this.role === 'ADMINISTRATOR';
  }
}
