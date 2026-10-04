import { Routes } from '@angular/router';
export const MONITORING_ROUTES: Routes = [
  {
    path: 'monitoring',
    title: 'Monitoreo operacional — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/monitoring-dashboard/monitoring-dashboard.page').then(
        (m) => m.MonitoringDashboardPage,
      ),
  },
  {
    path: 'monitoring/alerts',
    title: 'Alertas operacionales — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/operational-alerts/operational-alerts.page').then(
        (m) => m.OperationalAlertsPage,
      ),
  },
  {
    path: 'monitoring/incidents',
    title: 'Incidentes de calidad — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/quality-incidents/quality-incidents.page').then(
        (m) => m.QualityIncidentsPage,
      ),
  },
  {
    path: 'monitoring/traceability',
    title: 'Trazabilidad operacional — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/traceability/traceability.page').then((m) => m.TraceabilityPage),
  },
];
