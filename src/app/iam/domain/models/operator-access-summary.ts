export type OperatorProfileStatus = 'PENDING_FIRST_ACCESS' | 'ACTIVE' | 'INACTIVE';

export interface OperatorAssignmentSummary {
  readonly assignmentId: string;
  readonly reservoirId: string;
  readonly reservoirName: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
  readonly status: 'ACTIVE' | 'CLOSED';
}

/** Proyección de solo lectura del grupo, perfil y asignaciones asociadas al operario. */
export class OperatorAccessSummary {
  readonly operatorAccountId: string;
  readonly operatorProfileId: string | null;
  readonly profileStatus: OperatorProfileStatus | null;
  readonly groupId: string | null;
  readonly groupName: string | null;
  readonly assignments: ReadonlyArray<OperatorAssignmentSummary>;

  constructor(
    operatorAccountId: string,
    operatorProfileId: string | null,
    profileStatus: OperatorProfileStatus | null,
    groupId: string | null,
    groupName: string | null,
    assignments: ReadonlyArray<OperatorAssignmentSummary> = [],
  ) {
    this.operatorAccountId = operatorAccountId;
    this.operatorProfileId = operatorProfileId;
    this.profileStatus = profileStatus;
    this.groupId = groupId;
    this.groupName = groupName;
    this.assignments = assignments;
  }

  get hasProfile(): boolean {
    return Boolean(this.operatorProfileId && this.operatorProfileId.trim().length > 0);
  }

  get hasGroup(): boolean {
    return Boolean(this.groupId && this.groupId.trim().length > 0);
  }

  get hasActiveAssignments(): boolean {
    return this.assignments.some(
      (a) => a.status === 'ACTIVE' && Boolean(a.reservoirId) && Boolean(a.deviceId),
    );
  }

  get isReadyForFirstAccess(): boolean {
    return (
      this.hasProfile &&
      this.profileStatus === 'PENDING_FIRST_ACCESS' &&
      this.hasGroup &&
      this.hasActiveAssignments
    );
  }
}
