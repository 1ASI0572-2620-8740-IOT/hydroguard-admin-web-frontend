import { handleGroups } from './groups.mjs';
import { handleReservoirs } from './reservoirs.mjs';
import { handleDevices } from './devices.mjs';
import { handleProfiles } from './profiles.mjs';

export const isConfigurationPath = (path) =>
  /^\/api\/v1\/(groups|reservoirs|devices|operator-profiles|assignments|operational-options|available-pairs|organizations)(\/|$)/.test(
    path,
  );

export const handleConfiguration = (request) => {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    return { status: 422, body: { message: 'El cuerpo debe ser un objeto JSON.' } };
  }
  const parts = request.url.pathname.slice('/api/v1/'.length).split('/').map(decodeURIComponent);
  if (parts.join('/') === 'organizations/current' && request.method === 'GET') {
    const organization = request.db.organizations.find(
      (item) => item.id === request.organizationId,
    );
    return {
      status: 200,
      body: { id: organization.id, name: organization.name, segment: organization.segment },
    };
  }
  for (const handler of [handleGroups, handleReservoirs, handleDevices, handleProfiles]) {
    const result = handler({ ...request, parts });
    if (result) return result;
  }
  return { status: 404, body: { message: 'Endpoint no encontrado.' } };
};
