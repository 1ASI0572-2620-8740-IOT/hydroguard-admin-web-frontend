export interface AvailablePair {
  readonly reservoirId: string;
  readonly reservoirName: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
}
export interface Assignment extends AvailablePair {
  readonly id: string;
  readonly operatorProfileId: string;
  readonly status: 'ACTIVE' | 'CLOSED';
  readonly assignedAt: string;
  readonly closedAt: string | null;
}
