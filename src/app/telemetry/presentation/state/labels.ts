import { Pipe, PipeTransform } from '@angular/core';

const labels: Readonly<Record<string, string>> = {
  DEVICE: 'Dispositivo físico',
  SIMULATOR: 'Simulado (Wokwi)',
  ONLINE: 'En línea',
  DELAYED: 'Comunicación retrasada',
  OFFLINE: 'Sin conexión',
  UNKNOWN: 'Sin comunicación registrada',
  INTEGRAL_PRODUCT: 'Producto integral',
  SIMULATION: 'Simulación',
  ACADEMIC_PROTOTYPE: 'Prototipo académico',
  ACTIVE_UNLINKED: 'Activo sin vincular',
  ACTIVE_UNASSIGNED: 'Activo sin responsable',
  ACTIVE_ASSIGNED: 'Activo asignado',
  MAINTENANCE: 'Mantenimiento',
  INACTIVE: 'Inactivo',
};

@Pipe({ name: 'telemetryLabel', standalone: true })
export class TelemetryLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (labels[value] ?? value) : '—';
  }
}
