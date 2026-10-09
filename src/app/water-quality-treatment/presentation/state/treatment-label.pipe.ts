import { Pipe, PipeTransform } from '@angular/core';
const LABELS: Readonly<Record<string, string>> = {
  NOT_STARTED: 'Sin iniciar',
  MEASURING: 'Midiendo',
  EVALUATING: 'Evaluando',
  PENDING_CORRECTION_APPROVAL: 'Pendiente de aprobación',
  CORRECTING: 'Corrigiendo',
  WAITING: 'Esperando',
  REEVALUATING: 'Reevaluando',
  READY: 'Listo para liberar',
  RELEASING: 'Liberando',
  COMPLETED: 'Finalizado',
  EMERGENCY: 'Emergencia',
  NOT_REQUIRED: 'No requerida',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  MANUAL: 'Manual',
  AUTOMATIC: 'Automática',
  NOT_ELIGIBLE: 'No elegible',
  PENDING_CONFIRMATION: 'Pendiente de confirmación',
  AUTHORIZED: 'Autorizada',
  EXECUTING: 'En ejecución',
  CONFIRMED: 'Confirmada',
  FAILED: 'Fallo',
  SUCCESS: 'Correcto',
  WARNING: 'Advertencia',
  INFO: 'Información',
};
@Pipe({ name: 'treatmentLabel', standalone: true })
export class TreatmentLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (LABELS[value] ?? value) : '—';
  }
}
