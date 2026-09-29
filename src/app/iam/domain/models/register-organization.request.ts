export type OrganizationSegment = 'HYDROPONIC' | 'TEXTILE';

export class RegisterOrganizationRequest {
  readonly organizationName: string;
  readonly ruc: string;
  readonly phone: string;
  readonly segment: OrganizationSegment;
  readonly administratorName: string;
  readonly administratorEmail: string;
  readonly password: string;

  constructor(
    organizationName: string,
    ruc: string,
    phone: string,
    segment: OrganizationSegment,
    administratorName: string,
    administratorEmail: string,
    password: string,
  ) {
    this.organizationName = organizationName?.trim() ?? '';
    this.ruc = ruc?.trim() ?? '';
    this.phone = phone?.trim() ?? '';
    this.segment = segment;
    this.administratorName = administratorName?.trim() ?? '';
    this.administratorEmail = administratorEmail?.trim().toLowerCase() ?? '';
    this.password = password ?? '';
  }
}
