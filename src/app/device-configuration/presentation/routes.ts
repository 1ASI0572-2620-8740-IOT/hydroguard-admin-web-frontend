import { Routes } from '@angular/router';
export const CONFIGURATION_ROUTES: Routes = [
  {
    path: 'groups',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/work-groups/work-groups.page').then((m) => m.WorkGroupsPage),
  },
  {
    path: 'groups/new',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/work-group-create/work-group-create.page').then((m) => m.WorkGroupCreatePage),
  },
  {
    path: 'groups/:groupId',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/work-group-detail/work-group-detail.page').then((m) => m.WorkGroupDetailPage),
  },
  {
    path: 'reservoirs',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () => import('./pages/reservoirs/reservoirs.page').then((m) => m.ReservoirsPage),
  },
  {
    path: 'reservoirs/new',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/reservoir-create/reservoir-create.page').then((m) => m.ReservoirCreatePage),
  },
  {
    path: 'reservoirs/:reservoirId',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/reservoir-detail/reservoir-detail.page').then((m) => m.ReservoirDetailPage),
  },
  {
    path: 'devices',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () => import('./pages/devices/devices.page').then((m) => m.DevicesPage),
  },
  {
    path: 'devices/new',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/device-create/device-create.page').then((m) => m.DeviceCreatePage),
  },
  {
    path: 'devices/:deviceId/configurations',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/configuration-versions/configuration-versions.page').then(
        (m) => m.ConfigurationVersionsPage,
      ),
  },
  {
    path: 'devices/:deviceId',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/device-detail/device-detail.page').then((m) => m.DeviceDetailPage),
  },
  {
    path: 'operator-profiles',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/operator-profiles/operator-profiles.page').then(
        (m) => m.OperatorProfilesPage,
      ),
  },
  {
    path: 'operator-profiles/new',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/operator-profile-create/operator-profile-create.page').then(
        (m) => m.OperatorProfileCreatePage,
      ),
  },
  {
    path: 'operator-profiles/:profileId',
    title: 'Configuración operativa — HydroGuard Admin',
    loadComponent: () =>
      import('./pages/operator-profile-detail/operator-profile-detail.page').then(
        (m) => m.OperatorProfileDetailPage,
      ),
  },
];
