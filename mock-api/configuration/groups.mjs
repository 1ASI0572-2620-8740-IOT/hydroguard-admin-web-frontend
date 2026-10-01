import {
  active,
  createRecord,
  deactivate,
  find,
  groupView,
  page,
  rejectScopeOverride,
  requireActive,
  requireDeactivation,
  reservoirView,
  scoped,
  textField,
  fail,
} from './helpers.mjs';

export const handleGroups = ({ method, parts, url, body, db, organizationId }) => {
  if (parts[0] !== 'groups') return null;
  if (parts.length === 1 && method === 'GET')
    return {
      status: 200,
      body: page(scoped(db.groups, organizationId).map(groupView), url.searchParams, [
        'name',
        'purpose',
      ]),
    };
  if (parts.length === 1 && method === 'POST') {
    rejectScopeOverride(body);
    const name = textField(body, 'name', 3);
    const purpose = textField(body, 'purpose', 3, 500);
    const classification = body.classification ? textField(body, 'classification', 1) : '';
    if (
      scoped(db.groups, organizationId).some(
        (item) => active(item) && item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      fail(409, 'Ya existe un grupo activo con ese nombre.');
    const organization = db.organizations.find((item) => item.id === organizationId);
    const group = createRecord('grp', organizationId, {
      name,
      purpose,
      classification,
      segment: organization.segment,
      status: 'ACTIVE',
    });
    db.groups.push(group);
    return { status: 201, body: groupView(group), changed: true };
  }
  if (parts.length >= 2) {
    const group = find(db.groups, parts[1], organizationId);
    if (parts.length === 2 && method === 'GET') {
      const members = scoped(db.operatorProfiles, organizationId)
        .filter((item) => item.groupId === group.id)
        .map((profile) => {
          const account = scoped(db.users, organizationId).find(
            (item) => item.id === profile.userId,
          );
          return {
            profileId: profile.id,
            userId: profile.userId,
            displayName: account?.displayName ?? 'Cuenta no disponible',
            status: profile.status,
          };
        });
      return {
        status: 200,
        body: {
          group: groupView(group),
          members,
          reservoirs: scoped(db.reservoirs, organizationId)
            .filter((item) => item.groupId === group.id)
            .map(reservoirView),
        },
      };
    }
    if (parts.length === 3 && parts[2] === 'status' && method === 'PATCH') {
      requireDeactivation(body);
      requireActive(group);
      if (
        scoped(db.reservoirs, organizationId).some(
          (item) => item.groupId === group.id && active(item),
        ) ||
        scoped(db.operatorProfiles, organizationId).some(
          (item) => item.groupId === group.id && active(item),
        )
      )
        fail(409, 'Desactive primero los reservorios y perfiles activos del grupo.');
      deactivate(group);
      return { status: 204, changed: true };
    }
  }
  return null;
};
