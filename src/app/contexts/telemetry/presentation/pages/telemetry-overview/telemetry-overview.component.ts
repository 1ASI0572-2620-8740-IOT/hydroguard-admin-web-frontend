import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TelemetryDetailDialogComponent } from '../../components/telemetry-detail-dialog/telemetry-detail-dialog.component';

export type AvailabilityStatus = 'ONLINE' | 'LOST_MONITORING';

export interface TelemetryReading {
  ph: number;
  temperature: number;
}

export interface DeviceTelemetryItem {
  id: string;
  model: string;
  status: AvailabilityStatus;
  lastReading: TelemetryReading;
  lastHeartbeat: Date;
}

@Component({
  selector: 'hg-telemetry-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  templateUrl: './telemetry-overview.component.html',
  styleUrl: './telemetry-overview.component.scss',
})
export class TelemetryOverviewComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  // Columnas de la tabla según especificación
  readonly displayedColumns: string[] = [
    'device',
    'status',
    'lastReading',
    'lastHeartbeat',
    'actions',
  ];

  // Mock data representativa de BC-03 (IoT Telemetry and Device Integration)
  readonly devices = signal<DeviceTelemetryItem[]>([
    {
      id: 'ESP32-TK-001',
      model: 'ESP32-WROOM-32D (Físico)',
      status: 'ONLINE',
      lastReading: {
        ph: 7.24,
        temperature: 23.5,
      },
      lastHeartbeat: new Date('2026-10-01T17:08:42'),
    },
    {
      id: 'ESP32-TK-002',
      model: 'ESP32-S3 Node (Físico)',
      status: 'ONLINE',
      lastReading: {
        ph: 6.95,
        temperature: 24.1,
      },
      lastHeartbeat: new Date('2026-10-01T17:09:15'),
    },
    {
      id: 'WOKWI-SIM-001',
      model: 'ESP32 Gateway (Wokwi Simulador)',
      status: 'LOST_MONITORING',
      lastReading: {
        ph: 8.12,
        temperature: 26.8,
      },
      lastHeartbeat: new Date('2026-10-01T16:32:05'),
    },
    {
      id: 'ESP32-TK-003',
      model: 'ESP32-WROOM-32U (Físico)',
      status: 'ONLINE',
      lastReading: {
        ph: 7.10,
        temperature: 22.9,
      },
      lastHeartbeat: new Date('2026-10-01T17:07:55'),
    },
  ]);

  // Estados de control y filtros
  searchQuery = '';
  statusFilter: 'ALL' | AvailabilityStatus = 'ALL';
  readonly loading = signal<boolean>(false);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);

  // Señales calculadas (DDD Presentation State)
  readonly totalDevices = computed(() => this.devices().length);

  readonly filteredDevices = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    const filter = this.statusFilter;

    return this.devices().filter((device) => {
      const matchesSearch =
        !query ||
        device.id.toLowerCase().includes(query) ||
        device.model.toLowerCase().includes(query);

      const matchesStatus = filter === 'ALL' || device.status === filter;

      return matchesSearch && matchesStatus;
    });
  });

  readonly pagedDevices = computed(() => {
    const items = this.filteredDevices();
    const start = this.pageIndex() * this.pageSize();
    return items.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    // Inicialización del componente
  }

  onSearchChange(): void {
    this.pageIndex.set(0);
  }

  onStatusFilterChange(): void {
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onRefresh(): void {
    this.loading.set(true);
    // Simula una consulta reactiva de heartbeat y telemetría
    setTimeout(() => {
      this.loading.set(false);
    }, 600);
  }

  onViewDetails(device: DeviceTelemetryItem): void {
    this.dialog.open(TelemetryDetailDialogComponent, {
      data: device,
      width: '680px',
      maxWidth: '95vw',
      autoFocus: false,
    });
  }
}
