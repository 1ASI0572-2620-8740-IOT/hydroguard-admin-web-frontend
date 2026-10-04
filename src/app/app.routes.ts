import { Routes } from '@angular/router';
import { adminAuthGuard } from './iam/presentation/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./iam/presentation/pages/admin-login/admin-login.page').then((m) => m.AdminLoginPage),
    title: 'Iniciar Sesión — HydroGuard Admin',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./iam/presentation/pages/administrator-register/administrator-register.page').then(
        (m) => m.AdministratorRegisterPage,
      ),
    title: 'Registrar Empresa — HydroGuard Admin',
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    canActivateChild: [adminAuthGuard],
    loadComponent: () =>
      import('./core/layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'telemetry',
        loadComponent: () =>
          import(
            './contexts/telemetry/presentation/pages/telemetry-overview/telemetry-overview.component'
          ).then((m) => m.TelemetryOverviewComponent),
        title: 'Monitoreo de Telemetría — HydroGuard Admin',
      },
      {
        path: '',
        loadChildren: () =>
          import('./device-configuration/presentation/routes').then((m) => m.CONFIGURATION_ROUTES),
      },
      {
        path: '',
        loadChildren: () =>
          import('./operational-monitoring/presentation/routes').then((m) => m.MONITORING_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('./iam/presentation/routes').then((m) => m.IAM_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
