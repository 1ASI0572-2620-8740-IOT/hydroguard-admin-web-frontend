export type OperatorProfileStatus = 'PENDING_FIRST_ACCESS' | 'ACTIVE' | 'INACTIVE';
export interface OperatorProfile {
  readonly id: string;
  readonly userId: string;
  readonly groupId: string;
  readonly displayName: string;
  readonly groupName: string;
  readonly status: OperatorProfileStatus;
}
export interface CreateOperatorProfile {
  readonly userId: string;
  readonly groupId: string;
  readonly reservoirIds: ReadonlyArray<string>;
}
