import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeviceTelemetryItem } from '../../pages/telemetry-overview/telemetry-overview.component';

@Component({
  selector: 'hg-telemetry-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './telemetry-detail-dialog.component.html',
  styleUrl: './telemetry-detail-dialog.component.scss',
})
export class TelemetryDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<TelemetryDetailDialogComponent>);
  readonly device: DeviceTelemetryItem = inject(MAT_DIALOG_DATA);

  // Estado reactivo de actuación correctiva (Inbound/Outbound BC-03)
  readonly valveOpen = signal<boolean>(false);
  readonly valveOperating = signal<boolean>(false);
  readonly actionFeedback = signal<string | null>(null);

  // Información técnica derivada (Identidad Técnica de hardware)
  get macAddress(): string {
    const hash = this.device.id.replace(/[^A-Za-z0-9]/g, '').padEnd(6, '0').slice(-6).toUpperCase();
    return `24:6F:28:${hash.slice(0, 2)}:${hash.slice(2, 4)}:${hash.slice(4, 6)}`;
  }

  get firmwareVersion(): string {
    return this.device.model.includes('Wokwi') ? 'v1.4.0-wokwi-sim' : 'v2.1.8-esp-idf';
  }

  get isOnline(): boolean {
    return this.device.status === 'ONLINE';
  }

  // Simulación de historial reciente (3 últimas lecturas)
  get historyReadings() {
    const basePh = this.device.lastReading.ph;
    const baseTemp = this.device.lastReading.temperature;
    const now = new Date(this.device.lastHeartbeat);

    return [
      {
        timestamp: new Date(now.getTime()),
        ph: basePh,
        temperature: baseTemp,
        status: 'Validada',
      },
      {
        timestamp: new Date(now.getTime() - 30 * 1000),
        ph: +(basePh - 0.04).toFixed(2),
        temperature: +(baseTemp - 0.2).toFixed(1),
        status: 'Validada',
      },
      {
        timestamp: new Date(now.getTime() - 60 * 1000),
        ph: +(basePh + 0.03).toFixed(2),
        temperature: +(baseTemp + 0.1).toFixed(1),
        status: 'Validada',
      },
    ];
  }

  /**
   * Ejecuta la orden de actuación correctiva sobre la válvula (Abrir / Cerrar)
   * según las reglas del Bounded Context BC-03.
   */
  toggleValve(): void {
    if (this.valveOperating()) return;

    this.valveOperating.set(true);
    this.actionFeedback.set('Enviando comando de actuación al dispositivo...');

    setTimeout(() => {
      const nextState = !this.valveOpen();
      this.valveOpen.set(nextState);
      this.valveOperating.set(false);
      this.actionFeedback.set(
        nextState
          ? 'Actuación confirmada: Válvula ABIERTA con éxito.'
          : 'Actuación confirmada: Válvula CERRADA con éxito.'
      );
    }, 700);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
