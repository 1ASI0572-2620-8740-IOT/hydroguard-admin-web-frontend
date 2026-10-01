import {
  active,
  addAssignments,
  assignmentView,
  availablePairs,
  closeAssignment,
  createRecord,
  deactivate,
  fail,
  find,
  hasProcess,
  page,
  rejectScopeOverride,
  requireActive,
  requireDeactivation,
  scoped,
  textField,
  validatePairs,
} from './helpers.mjs';

const profileView = (db, profile) => ({
  ...profile,
  displayName:
    scoped(db.users, profile.organizationId).find((item) => item.id === profile.userId)
      ?.displayName ?? 'Cuenta no disponible',
  groupName: find(db.groups, profile.groupId, profile.organizationId).name,
});
const revokePendingCodes = (db, profileId) => {
  for (const code of db.firstAccessCodes.filter(
    (item) => item.operatorProfileId === profileId && item.status === 'ACTIVE',
  )) {
    code.status = 'REVOKED';
    code.revokedAt = new Date().toISOString();
  }
};

export const handleProfiles = ({ method, parts, url, body, db, organizationId }) => {
  if (parts[0] === 'operational-options' && parts.length === 1 && method === 'GET') {
    const groups = scoped(db.groups, organizationId)
      .filter(active)
      .map((item) => ({ id: item.id, name: item.name }));
    const reservoirs = scoped(db.reservoirs, organizationId)
      .filter(active)
      .filter(
        (item) =>
          !scoped(db.devices, organizationId).some((device) => device.reservoirId === item.id),
      )
      .map((item) => ({ id: item.id, name: item.name, groupId: item.groupId }));
    const operators = scoped(db.users, organizationId)
      .filter(
        (item) =>
          item.status === 'ACTIVE' &&
          (item.role === 'ROLE_OPERATOR' || item.roles?.includes('ROLE_OPERATOR')) &&
          !scoped(db.operatorProfiles, organizationId).some(
            (profile) => profile.userId === item.id,
          ),
      )
      .map((item) => ({ id: item.id, name: item.displayName }));
    return { status: 200, body: { groups, reservoirs, operators } };
  }
  if (parts[0] === 'available-pairs' && parts.length === 1 && method === 'GET') {
    const group = requireActive(find(db.groups, url.searchParams.get('groupId'), organizationId));
    return { status: 200, body: availablePairs(db, organizationId, group.id) };
  }
  if (
    parts[0] === 'assignments' &&
    parts.length === 3 &&
    parts[2] === 'close' &&
    method === 'POST'
  ) {
    const assignment = find(db.deviceAssignments, parts[1], organizationId);
    if (assignment.status !== 'ACTIVE' || hasProcess(db, assignment.deviceId))
      fail(409, 'La asignación ya está cerrada o tiene un proceso activo.');
    closeAssignment(db, assignment);
    const remaining = db.deviceAssignments.some(
      (item) => item.operatorProfileId === assignment.operatorProfileId && item.status === 'ACTIVE',
    );
    if (!remaining) revokePendingCodes(db, assignment.operatorProfileId);
    return { status: 204, changed: true };
  }
  if (parts[0] !== 'operator-profiles') return null;
  if (parts.length === 1 && method === 'GET')
    return {
      status: 200,
      body: page(
        scoped(db.operatorProfiles, organizationId).map((item) => profileView(db, item)),
        url.searchParams,
        ['displayName', 'groupName'],
      ),
    };
  if (parts.length === 1 && method === 'POST') {
    rejectScopeOverride(body);
    const user = requireActive(find(db.users, textField(body, 'userId'), organizationId));
    if (!(user.role === 'ROLE_OPERATOR' || user.roles?.includes('ROLE_OPERATOR')))
      fail(422, 'La cuenta debe pertenecer a un operario.');
    if (scoped(db.operatorProfiles, organizationId).some((item) => item.userId === user.id))
      fail(409, 'La cuenta ya tiene un perfil y un grupo.');
    const group = requireActive(find(db.groups, textField(body, 'groupId'), organizationId));
    const pairs = validatePairs(db, organizationId, group.id, body.reservoirIds);
    const profile = createRecord('prof', organizationId, {
      userId: user.id,
      groupId: group.id,
      segment: group.segment,
      status: 'PENDING_FIRST_ACCESS',
    });
    db.operatorProfiles.push(profile);
    addAssignments(db, profile, pairs);
    return { status: 201, body: profileView(db, profile), changed: true };
  }
  if (parts.length >= 2) {
    const profile = find(db.operatorProfiles, parts[1], organizationId);
    if (parts.length === 2 && method === 'GET')
      return {
        status: 200,
        body: {
          profile: profileView(db, profile),
          assignments: scoped(db.deviceAssignments, organizationId)
            .filter((item) => item.operatorProfileId === profile.id)
            .map((item) => assignmentView(db, item)),
        },
      };
    if (parts.length === 3 && parts[2] === 'assignments' && method === 'POST') {
      requireActive(profile);
      requireActive(find(db.users, profile.userId, organizationId));
      requireActive(find(db.groups, profile.groupId, organizationId));
      const pairs = validatePairs(db, organizationId, profile.groupId, body.reservoirIds);
      addAssignments(db, profile, pairs);
      profile.updatedAt = new Date().toISOString();
      return { status: 204, changed: true };
    }
    if (parts.length === 3 && parts[2] === 'status' && method === 'PATCH') {
      requireDeactivation(body);
      requireActive(profile);
      const assignments = scoped(db.deviceAssignments, organizationId).filter(
        (item) => item.operatorProfileId === profile.id && item.status === 'ACTIVE',
      );
      if (assignments.some((item) => hasProcess(db, item.deviceId)))
        fail(409, 'El perfil tiene un proceso activo.');
      for (const assignment of assignments) closeAssignment(db, assignment);
      revokePendingCodes(db, profile.id);
      deactivate(profile);
      return { status: 204, changed: true };
    }
  }
  return null;
};
