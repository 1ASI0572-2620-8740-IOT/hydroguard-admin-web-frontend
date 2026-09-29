import { Routes } from '@angular/router';

export const IAM_ROUTES: Routes = [
  {
    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/users/users.page').then((m) => m.UsersPage),
        title: 'Operarios — HydroGuard Admin',
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/operator-create/operator-create.page').then((m) => m.OperatorCreatePage),
        title: 'Nuevo Operario — HydroGuard Admin',
      },
      {
        path: ':userId',
        loadComponent: () =>
          import('./pages/user-detail/user-detail.page').then((m) => m.UserDetailPage),
        title: 'Detalle del Operario — HydroGuard Admin',
      },
      {
        path: ':userId/first-access',
        loadComponent: () =>
          import('./pages/first-access-code/first-access-code.page').then(
            (m) => m.FirstAccessCodePage,
          ),
        title: 'Código de Primer Acceso — HydroGuard Admin',
      },
    ],
  },
];
