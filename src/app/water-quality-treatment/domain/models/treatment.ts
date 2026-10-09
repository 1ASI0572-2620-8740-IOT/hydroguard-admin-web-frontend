export type TreatmentState =
  | 'NOT_STARTED'
  | 'MEASURING'
  | 'EVALUATING'
  | 'PENDING_CORRECTION_APPROVAL'
  | 'CORRECTING'
  | 'WAITING'
  | 'REEVALUATING'
  | 'READY'
  | 'RELEASING'
  | 'FAILED'
  | 'EMERGENCY'
  | 'COMPLETED';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED';
export type ReleaseMode = 'MANUAL' | 'AUTOMATIC';
export type ReleaseEligibility = 'NOT_ELIGIBLE' | 'PENDING_CONFIRMATION' | 'AUTHORIZED';
export type TreatmentOutcome = 'INFO' | 'SUCCESS' | 'WARNING' | 'FAILURE';

export interface TreatmentMeasurement {
  readonly ph: number;
  readonly temperature: number;
  readonly measuredAt: string;
  readonly conforming: boolean;
}
export interface TreatmentCycle {
  readonly number: number;
  readonly action: string;
  readonly status: 'PENDING' | 'EXECUTING' | 'CONFIRMED' | 'FAILED';
  readonly startedAt: string;
  readonly confirmedAt: string | null;
  readonly result: string;
}
export interface TreatmentEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly outcome: TreatmentOutcome;
  readonly occurredAt: string;
}
export interface TreatmentProcessSummary {
  readonly id: string;
  readonly deviceId: string;
  readonly deviceSerialNumber: string;
  readonly reservoirName: string;
  readonly operatorName: string | null;
  readonly state: TreatmentState;
  readonly strategy: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly currentCycle: number;
  readonly maximumCycles: number;
  readonly releaseMode: ReleaseMode;
  readonly releaseEligibility: ReleaseEligibility;
  readonly latestMeasurement: TreatmentMeasurement;
  readonly startedAt: string;
  readonly updatedAt: string;
}
export interface TreatmentProcessDetail extends TreatmentProcessSummary {
  readonly configurationVersion: number;
  readonly phMin: number;
  readonly phMax: number;
  readonly temperatureMin: number;
  readonly temperatureMax: number;
  readonly waitingMinutes: number;
  readonly initialMeasurement: TreatmentMeasurement;
  readonly cycles: ReadonlyArray<TreatmentCycle>;
  readonly events: ReadonlyArray<TreatmentEvent>;
  readonly failureReason: string | null;
  readonly emergencyReason: string | null;
  readonly completedAt: string | null;
}
export interface TreatmentPage {
  readonly items: ReadonlyArray<TreatmentProcessSummary>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
export interface TreatmentQuery {
  readonly searchTerm?: string;
  readonly status?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}
