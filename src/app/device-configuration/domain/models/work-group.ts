export type OrganizationSegment = 'TEXTILE' | 'HYDROPONIC';
export type ResourceStatus = 'ACTIVE' | 'INACTIVE';
export interface WorkGroup {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly classification: string;
  readonly segment: OrganizationSegment;
  readonly status: ResourceStatus;
}
export interface CreateWorkGroup {
  readonly name: string;
  readonly purpose: string;
  readonly classification: string;
}
export interface GroupMember {
  readonly profileId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly status: string;
}
