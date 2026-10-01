import {
  active,
  assigned,
  createRecord,
  deviceActive,
  deviceView,
  enumField,
  fail,
  find,
  hasProcess,
  page,
  rejectScopeOverride,
  requireActive,
  requireDeactivation,
  scoped,
  textField,
} from './helpers.mjs';

export const handleDevices = ({ method, parts, url, body, db, organizationId }) => {
  if (parts[0] !== 'devices') return null;
  if (parts.length === 1 && method === 'GET') {
    let devices = scoped(db.devices, organizationId).map((item) => deviceView(db, item));
    for (const key of ['availability', 'operatingEnvironment', 'configurationStatus'])
      if (url.searchParams.has(key))
        devices = devices.filter((item) => item[key] === url.searchParams.get(key));
    if (url.searchParams.get('unlinked') === 'true')
      devices = devices.filter((item) => item.lifecycleStatus === 'ACTIVE_UNLINKED');
    return {
      status: 200,
      body: page(devices, url.searchParams, ['serialNumber', 'alias', 'deviceModel']),
    };
  }
  if (parts.length === 1 && method === 'POST') {
    rejectScopeOverride(body);
    const serialNumber = textField(body, 'serialNumber', 3, 80);
    const alias = textField(body, 'alias', 3);
    const deviceModel = textField(body, 'deviceModel', 3, 80);
    const operatingEnvironment = enumField(body, 'operatingEnvironment', [
      'INTEGRAL_PRODUCT',
      'SIMULATION',
      'ACADEMIC_PROTOTYPE',
    ]);
    const allowed = [
      'PH_SENSOR',
      'TEMPERATURE_SENSOR',
      'DOSING',
      'HEATING',
      'COOLING',
      'RELEASE_VALVE',
    ];
    if (
      !Array.isArray(body.capabilities) ||
      !body.capabilities.length ||
      body.capabilities.some((value) => !allowed.includes(value)) ||
      new Set(body.capabilities).size !== body.capabilities.length
    )
      fail(422, 'Capacidades inválidas.', {
        capabilities: 'Seleccione al menos una capacidad admitida.',
      });
    if (
      db.devices.some(
        (item) => item.serialNumber.toLocaleLowerCase() === serialNumber.toLocaleLowerCase(),
      )
    )
      fail(409, 'El número de serie ya está registrado.');
    const organization = db.organizations.find((item) => item.id === organizationId);
    const device = createRecord('dev', organizationId, {
      serialNumber,
      alias,
      deviceModel,
      operatingEnvironment,
      capabilities: body.capabilities,
      segment: organization.segment,
      lifecycleStatus: 'ACTIVE_UNLINKED',
      availability: 'UNKNOWN',
      reservoirId: null,
      lastCommunicationAt: null,
    });
    db.devices.push(device);
    return { status: 201, body: deviceView(db, device), changed: true };
  }
  if (parts.length >= 2) {
    const device = find(db.devices, parts[1], organizationId);
    if (parts.length === 2 && method === 'GET') {
      const reservoir = device.reservoirId
        ? find(db.reservoirs, device.reservoirId, organizationId)
        : null;
      const assignment = scoped(db.deviceAssignments, organizationId).find(
        (item) => item.deviceId === device.id && item.status === 'ACTIVE',
      );
      return {
        status: 200,
        body: {
          device: deviceView(db, device),
          reservoirName: reservoir?.name ?? null,
          responsibleProfileId: assignment?.operatorProfileId ?? null,
        },
      };
    }
    if (parts.length === 3 && parts[2] === 'link' && method === 'POST') {
      const reservoir = requireActive(
        find(db.reservoirs, textField(body, 'reservoirId'), organizationId),
      );
      requireActive(find(db.groups, reservoir.groupId, organizationId));
      if (
        !deviceActive(device) ||
        device.reservoirId ||
        device.lifecycleStatus !== 'ACTIVE_UNLINKED' ||
        scoped(db.devices, organizationId).some((item) => item.reservoirId === reservoir.id)
      )
        fail(409, 'El dispositivo o el reservorio ya está vinculado o no está activo.');
      device.reservoirId = reservoir.id;
      device.lifecycleStatus = 'ACTIVE_UNASSIGNED';
      device.updatedAt = new Date().toISOString();
      return { status: 204, changed: true };
    }
    if (parts.length === 3 && parts[2] === 'unlink' && method === 'POST') {
      if (!device.reservoirId || assigned(db, device.id) || hasProcess(db, device.id))
        fail(
          409,
          'Cierre primero la asignación y cualquier proceso activo para retirar la vinculación.',
        );
      device.reservoirId = null;
      device.lifecycleStatus = 'ACTIVE_UNLINKED';
      device.updatedAt = new Date().toISOString();
      return { status: 204, changed: true };
    }
    if (parts.length === 3 && parts[2] === 'status' && method === 'PATCH') {
      requireDeactivation(body);
      if (
        device.lifecycleStatus === 'INACTIVE' ||
        device.reservoirId ||
        assigned(db, device.id) ||
        hasProcess(db, device.id)
      )
        fail(409, 'El dispositivo está inactivo o aún tiene vínculos o un proceso activo.');
      device.lifecycleStatus = 'INACTIVE';
      device.updatedAt = new Date().toISOString();
      return { status: 204, changed: true };
    }
    if (parts.length === 3 && parts[2] === 'configurations' && method === 'GET') {
      const versions = scoped(db.configurations, organizationId)
        .filter((item) => item.deviceId === device.id)
        .sort((a, b) => b.configurationVersion - a.configurationVersion);
      return { status: 200, body: { device: deviceView(db, device), versions } };
    }
  }
  return null;
};
