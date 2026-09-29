export class CreateOperatorRequest {
  readonly displayName: string;
  readonly identifier: string;
  readonly password: string;

  constructor(displayName: string, identifier: string, password: string) {
    this.displayName = displayName?.trim() ?? '';
    this.identifier = identifier?.trim() ?? '';
    this.password = password ?? '';
  }
}
