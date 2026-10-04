import { Pipe, PipeTransform } from '@angular/core';
const LABELS: Readonly<Record<string, string>> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
  ACTIVE: 'Activa',
  ACKNOWLEDGED: 'Atendida',
  RESOLVED: 'Resuelta',
  OPEN: 'Abierto',
  UNDER_REVIEW: 'En revisión',
  CLOSED: 'Cerrado',
  QUALITY_INCIDENT: 'Incidente de calidad',
  MONITORING_LOSS: 'Pérdida de monitoreo',
  READING: 'Lectura',
  CORRECTION: 'Corrección',
  WAITING: 'En espera',
  READY: 'Listo',
  FAILURE: 'Fallo',
  RELEASED: 'Liberado',
  UPDATED: 'Actualizada',
  OUTDATED: 'Desactualizada',
  ONLINE: 'En línea',
  DELAYED: 'Comunicación retrasada',
  OFFLINE: 'Sin conexión',
  UNKNOWN: 'Sin comunicación',
  INFO: 'Información',
  SUCCESS: 'Correcto',
  WARNING: 'Advertencia',
};
@Pipe({ name: 'monitoringLabel', standalone: true })
export class MonitoringLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (LABELS[value] ?? value) : '—';
  }
}
