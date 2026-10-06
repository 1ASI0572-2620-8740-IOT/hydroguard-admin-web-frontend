import { Pipe, PipeTransform } from '@angular/core';
const labels: Readonly<Record<string, string>> = {
  TEXTILE: 'Textil',
  HYDROPONIC: 'Hidropónico',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING_FIRST_ACCESS: 'Pendiente de primer acceso',
  CLOSED: 'Cerrada',
  ACTIVE_UNLINKED: 'Activo sin vincular',
  ACTIVE_UNASSIGNED: 'Activo sin responsable',
  ACTIVE_ASSIGNED: 'Activo asignado',
  MAINTENANCE: 'Mantenimiento',
  ONLINE: 'En línea',
  DELAYED: 'Comunicación retrasada',
  OFFLINE: 'Sin conexión',
  UNKNOWN: 'Sin comunicación registrada',
  INTEGRAL_PRODUCT: 'Producto integral',
  SIMULATION: 'Simulación',
  ACADEMIC_PROTOTYPE: 'Prototipo académico',
  PH_SENSOR: 'Sensor de pH',
  TEMPERATURE_SENSOR: 'Sensor de temperatura',
  DOSING: 'Dosificación',
  HEATING: 'Calentamiento',
  COOLING: 'Enfriamiento',
  RELEASE_VALVE: 'Válvula de liberación',
  MISSING: 'Sin configuración publicada',
  COMPATIBLE: 'Configuración compatible',
  INCOMPATIBLE: 'Configuración incompatible',
  PENDING: 'Identidad pendiente',
  REVOKED: 'Identidad revocada',
  SUMP: 'Fosa',
  TANK: 'Tanque',
  RESERVOIR: 'Reservorio',
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  MANUAL: 'Manual',
  AUTOMATIC: 'Automática',
};
@Pipe({ name: 'configurationLabel', standalone: true })
export class ConfigurationLabelPipe implements PipeTransform {
  transform(value: string): string {
    return labels[value] ?? value;
  }
}
