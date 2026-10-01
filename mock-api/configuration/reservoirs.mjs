import {
  active,
  assigned,
  createRecord,
  deactivate,
  enumField,
  fail,
  find,
  page,
  rejectScopeOverride,
  requireActive,
  requireDeactivation,
  reservoirView,
  scoped,
  textField,
  deviceView,
} from './helpers.mjs';

export const handleReservoirs = ({ method, parts, url, body, db, organizationId }) => {
  if (parts[0] !== 'reservoirs') return null;
  if (parts.length === 1 && method === 'GET') {
    let items = scoped(db.reservoirs, organizationId);
    if (url.searchParams.has('groupId')) {
      const group = find(db.groups, url.searchParams.get('groupId'), organizationId);
      items = items.filter((item) => item.groupId === group.id);
    }
    return {
      status: 200,
      body: page(items.map(reservoirView), url.searchParams, ['name', 'code', 'location']),
    };
  }
  if (parts.length === 1 && method === 'POST') {
    rejectScopeOverride(body);
    const group = requireActive(find(db.groups, textField(body, 'groupId'), organizationId));
    const name = textField(body, 'name', 3);
    const code = textField(body, 'code', 2, 40);
    const reservoirType = enumField(body, 'reservoirType', ['SUMP', 'TANK', 'RESERVOIR']);
    const location = textField(body, 'location', 3, 250);
    const capacityLiters = body.capacityLiters ?? null;
    if (
      capacityLiters !== null &&
      (typeof capacityLiters !== 'number' ||
        !Number.isFinite(capacityLiters) ||
        capacityLiters <= 0)
    )
      fail(422, 'Capacidad inválida.', { capacityLiters: 'Debe ser un número positivo.' });
    if (
      scoped(db.reservoirs, organizationId).some(
        (item) => item.code.toLocaleLowerCase() === code.toLocaleLowerCase(),
      )
    )
      fail(409, 'El código interno ya existe en su organización.');
    const reservoir = createRecord('res', organizationId, {
      groupId: group.id,
      segment: group.segment,
      name,
      code,
      reservoirType,
      location,
      capacityLiters,
      status: 'ACTIVE',
    });
    db.reservoirs.push(reservoir);
    return { status: 201, body: reservoirView(reservoir), changed: true };
  }
  if (parts.length >= 2) {
    const reservoir = find(db.reservoirs, parts[1], organizationId);
    if (parts.length === 2 && method === 'GET') {
      const device = scoped(db.devices, organizationId).find(
        (item) => item.reservoirId === reservoir.id && item.lifecycleStatus !== 'INACTIVE',
      );
      return {
        status: 200,
        body: {
          reservoir: reservoirView(reservoir),
          groupName: find(db.groups, reservoir.groupId, organizationId).name,
          device: device ? deviceView(db, device) : null,
        },
      };
    }
    if (parts.length === 3 && parts[2] === 'status' && method === 'PATCH') {
      requireDeactivation(body);
      requireActive(reservoir);
      if (
        assigned(db, reservoir.id) ||
        scoped(db.devices, organizationId).some((item) => item.reservoirId === reservoir.id)
      )
        fail(
          409,
          'Cierre la asignación y retire la vinculación del dispositivo antes de desactivar el reservorio.',
        );
      deactivate(reservoir);
      return { status: 204, changed: true };
    }
  }
  return null;
};
