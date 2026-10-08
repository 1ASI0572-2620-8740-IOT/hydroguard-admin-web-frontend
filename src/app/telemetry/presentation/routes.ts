import { Routes } from '@angular/router';

export const TELEMETRY_ROUTES: Routes = [
  {
    path: '',
    title: 'Supervisión de Telemetría IoT — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/telemetry-overview/telemetry-overview.page').then(
        (m) => m.TelemetryOverviewPage,
      ),
  },
  {
    path: 'devices/:deviceId',
    title: 'Detalle de Telemetría de Dispositivo — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/device-telemetry-detail/device-telemetry-detail.page').then(
        (m) => m.DeviceTelemetryDetailPage,
      ),
  },
];
