import { Routes } from '@angular/router';
export const TREATMENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Procesos de tratamiento — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/treatment-processes/treatment-processes.page').then(
        (m) => m.TreatmentProcessesPage,
      ),
  },
  {
    path: ':processId',
    title: 'Detalle del tratamiento — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/treatment-process-detail/treatment-process-detail.page').then(
        (m) => m.TreatmentProcessDetailPage,
      ),
  },
];
