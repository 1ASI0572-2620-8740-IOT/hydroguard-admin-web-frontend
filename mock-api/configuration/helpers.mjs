import { randomUUID } from 'node:crypto';

export const fail = (status, message, errors) => {
  throw Object.assign(new Error(message), { status, errors });
};

export const active = (resource) => resource && resource.status !== 'INACTIVE';
export const scoped = (items, organizationId) =>
  items.filter((item) => item.organizationId === organizationId);
export const find = (items, id, organizationId) => {
  const item = scoped(items, organizationId).find((entry) => entry.id === id);
  if (!item) fail(404, 'Recurso no encontrado en su organización.');
  return item;
};
export const requireActive = (item) => {
  if (!active(item)) fail(409, 'El recurso está inactivo.');
  return item;
};
export const textField = (body, key, min = 1, max = 120) => {
  const value = typeof body[key] === 'string' ? body[key].trim() : '';
  if (value.length < min || value.length > max) {
    fail(422, 'Revise los campos del formulario.', {
      [key]: `Debe tener entre ${min} y ${max} caracteres.`,
    });
  }
  return value;
};
export const enumField = (body, key, values) => {
  if (!values.includes(body[key]))
    fail(422, 'Valor no permitido.', { [key]: 'Seleccione una opción válida.' });
  return body[key];
};
export const createRecord = (prefix, organizationId, values) => ({
  id: prefix + '-' + randomUUID(),
  organizationId,
  ...values,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export const deactivate = (item) => {
  item.status = 'INACTIVE';
  item.updatedAt = new Date().toISOString();
};
export const requireDeactivation = (body) => enumField(body, 'status', ['INACTIVE']);
export const page = (items, params, searchFields) => {
  const number = (key, fallback, maximum) => {
    const value = Number(params.get(key) ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
      fail(422, `Parámetro ${key} inválido.`);
    return value;
  };
  const pageNumber = number('page', 1, 100000);
  const pageSize = number('pageSize', 10, 100);
  const term = (params.get('searchTerm') || '').trim().toLocaleLowerCase();
  const status = params.get('status');
  const filtered = items.filter(
    (item) =>
      (!status || (item.status ?? item.lifecycleStatus ?? 'ACTIVE') === status) &&
      (!term ||
        searchFields.some((key) =>
          String(item[key] ?? '')
            .toLocaleLowerCase()
            .includes(term),
        )),
  );
  const sortBy = params.get('sortBy') || searchFields[0];
  if (!searchFields.includes(sortBy)) fail(422, 'Columna de ordenamiento inválida.');
  const direction = params.get('sortDirection') === 'desc' ? -1 : 1;
  filtered.sort(
    (left, right) =>
      direction * String(left[sortBy] ?? '').localeCompare(String(right[sortBy] ?? '')) ||
      left.id.localeCompare(right.id),
  );
  return {
    items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    total: filtered.length,
    page: pageNumber,
    pageSize,
  };
};
export const rejectScopeOverride = (body) => {
  for (const key of ['organizationId', 'segment']) {
    if (key in body)
      fail(422, 'La organización y el segmento se obtienen de la sesión.', {
        [key]: 'No se acepta este campo.',
      });
  }
};
export const assigned = (db, resourceId) =>
  db.deviceAssignments.some(
    (item) =>
      item.status === 'ACTIVE' && (item.deviceId === resourceId || item.reservoirId === resourceId),
  );
export const hasProcess = (db, deviceId) =>
  db.processes.some(
    (item) =>
      item.deviceId === deviceId &&
      !['COMPLETED', 'NOT_STARTED'].includes(item.state ?? item.status),
  );
export const deviceActive = (device) =>
  !['INACTIVE', 'MAINTENANCE'].includes(device.lifecycleStatus);
export const configurationSummary = (db, deviceId) => {
  const versions = db.configurations.filter((item) => item.deviceId === deviceId);
  const current = versions
    .filter((item) => item.status === 'PUBLISHED')
    .sort((a, b) => b.configurationVersion - a.configurationVersion)[0];
  return {
    configurationStatus: !current
      ? 'MISSING'
      : current.compatible === false
        ? 'INCOMPATIBLE'
        : 'COMPATIBLE',
    currentConfigurationVersion: current?.configurationVersion ?? null,
  };
};
export const groupView = (group) => ({
  ...group,
  status: group.status ?? 'ACTIVE',
  classification: group.classification ?? '',
});
export const reservoirView = (reservoir) => ({
  ...reservoir,
  status: reservoir.status ?? 'ACTIVE',
  capacityLiters: reservoir.capacityLiters ?? null,
});
export const deviceView = (db, device) => ({
  ...device,
  alias: device.alias ?? '',
  capabilities: device.capabilities ?? [],
  reservoirId: device.reservoirId ?? null,
  lastCommunicationAt: device.lastCommunicationAt ?? null,
  identityStatus:
    (db.deviceIdentities ?? []).find((identity) => identity.deviceId === device.id)?.status ??
    'PENDING',
  ...configurationSummary(db, device.id),
});
export const assignmentView = (db, assignment) => ({
  ...assignment,
  reservoirName:
    db.reservoirs.find((item) => item.id === assignment.reservoirId)?.name ??
    assignment.reservoirName,
  deviceSerialNumber:
    db.devices.find((item) => item.id === assignment.deviceId)?.serialNumber ??
    assignment.deviceSerialNumber,
});
export const availablePairs = (db, organizationId, groupId) =>
  scoped(db.reservoirs, organizationId)
    .filter((item) => active(item) && item.groupId === groupId && !assigned(db, item.id))
    .flatMap((reservoir) =>
      scoped(db.devices, organizationId)
        .filter(
          (device) =>
            device.reservoirId === reservoir.id && deviceActive(device) && !assigned(db, device.id),
        )
        .map((device) => ({
          reservoirId: reservoir.id,
          reservoirName: reservoir.name,
          deviceId: device.id,
          deviceSerialNumber: device.serialNumber,
        })),
    );
export const validatePairs = (db, organizationId, groupId, reservoirIds) => {
  if (
    !Array.isArray(reservoirIds) ||
    !reservoirIds.length ||
    reservoirIds.some((id) => typeof id !== 'string') ||
    new Set(reservoirIds).size !== reservoirIds.length
  ) {
    fail(422, 'Seleccione uno o varios reservorios distintos.', {
      reservoirIds: 'Seleccione al menos un par disponible.',
    });
  }
  for (const id of reservoirIds) find(db.reservoirs, id, organizationId);
  const pairs = availablePairs(db, organizationId, groupId);
  return reservoirIds.map((id) => {
    const pair = pairs.find((item) => item.reservoirId === id);
    if (!pair)
      fail(409, 'El par ya no está disponible o no pertenece al grupo. Recargue las opciones.');
    return pair;
  });
};
export const addAssignments = (db, profile, pairs) => {
  for (const pair of pairs) {
    db.deviceAssignments.push(
      createRecord('asgn', profile.organizationId, {
        ...pair,
        operatorProfileId: profile.id,
        status: 'ACTIVE',
        assignedAt: new Date().toISOString(),
      }),
    );
    find(db.devices, pair.deviceId, profile.organizationId).lifecycleStatus = 'ACTIVE_ASSIGNED';
  }
};
export const closeAssignment = (db, assignment) => {
  assignment.status = 'CLOSED';
  assignment.closedAt = new Date().toISOString();
  find(db.devices, assignment.deviceId, assignment.organizationId).lifecycleStatus =
    'ACTIVE_UNASSIGNED';
};
