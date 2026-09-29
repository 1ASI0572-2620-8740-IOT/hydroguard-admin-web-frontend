export class SignInRequest {
  readonly identifier: string;
  readonly password: string;

  constructor(identifier: string, password: string) {
    this.identifier = identifier?.trim() ?? '';
    this.password = password ?? '';
  }
}
