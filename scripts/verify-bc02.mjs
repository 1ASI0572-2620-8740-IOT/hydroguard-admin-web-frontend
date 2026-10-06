import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = join(root, 'mock-api', 'db.json');
const original = await readFile(sourcePath, 'utf8');
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'hydroguard-bc02-'));
const databasePath = join(temporaryDirectory, 'db.json');
const fixture = JSON.parse(original);
fixture.processes.push({
  id: 'process-bc02-active',
  organizationId: 'org-textile',
  deviceId: 'dev-101',
  state: 'CORRECTING',
});
await writeFile(databasePath, JSON.stringify(fixture));
const child = spawn(process.execPath, [join(root, 'mock-api', 'server.mjs')], {
  cwd: root,
  env: { ...process.env, PORT: '0', MOCK_DB_PATH: databasePath },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let checks = 0;
try {
  const baseUrl = await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('El mock no inició a tiempo.')), 10000);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error('El mock terminó: ' + code));
    });
    child.stdout.on('data', (buffer) => {
      const match = buffer.toString().match(/http:\/\/127\.0\.0\.1:(\d+)\/api\/v1/);
      if (match) {
        clearTimeout(timer);
        accept(match[0]);
      }
    });
    child.stderr.on('data', (buffer) => process.stderr.write(buffer));
  });
  const request = async (method, path, token, body, expected = 200) => {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = response.status === 204 ? undefined : await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    checks++;
    return result;
  };
  const admin = async (identifier) =>
    (
      await request('POST', '/authentication/sign-in', null, {
        identifier,
        password: 'adminpassword123',
      })
    ).token;
  const textile = await admin('admin.textil@hydroguard.pe');
  const hydroponic = await admin('admin.hidro@hydroguard.pe');
  await request('POST', '/assignments/asgn-1/close', textile, {}, 409);
  await request('PATCH', '/operator-profiles/prof-1/status', textile, { status: 'INACTIVE' }, 409);
  await request('PATCH', '/operators/usr-marcelino/status', textile, { status: 'INACTIVE' }, 409);
  await request('GET', '/groups', null, undefined, 401);
  const operatorSession = await request('POST', '/authentication/sign-in', null, {
    identifier: 'marcelino.valencia',
    password: 'operadorpassword123',
  });
  await request('GET', '/groups', operatorSession.token, undefined, 403);
  assert.equal((await request('GET', '/organizations/current', textile)).segment, 'TEXTILE');
  const group = await request(
    'POST',
    '/groups',
    textile,
    { name: 'Grupo de prueba BC02', purpose: 'Validación de contratos', classification: 'Pruebas' },
    201,
  );
  assert.equal(group.segment, 'TEXTILE');
  await request('POST', '/groups', textile, { name: group.name, purpose: 'Duplicado' }, 409);
  await request(
    'POST',
    '/groups',
    textile,
    { name: 'Grupo externo', purpose: 'Prueba', organizationId: 'org-hydroponic' },
    422,
  );
  await request(
    'POST',
    '/groups',
    textile,
    { name: 'Grupo externo', purpose: 'Prueba', segment: 'HYDROPONIC' },
    422,
  );
  const invalid = await request('POST', '/groups', textile, { name: '  ', purpose: 'Prueba' }, 422);
  assert.ok(invalid.errors.name);
  await request('POST', '/groups', textile, null, 422);
  await request('GET', '/groups?page=NaN', textile, undefined, 422);
  const listed = await request(
    'GET',
    '/groups?searchTerm=BC02&pageSize=5&sortBy=name&sortDirection=desc',
    textile,
  );
  assert.equal(listed.total, 1);
  assert.equal(listed.items[0].id, group.id);
  for (const path of [
    '/groups/' + group.id,
    '/devices/dev-101',
    '/reservoirs/res-101',
    '/operator-profiles/prof-1',
    '/devices/dev-101/configurations',
    '/available-pairs?groupId=' + group.id,
  ])
    await request('GET', path, hydroponic, undefined, 404);
  assert.ok(
    !(await request('GET', '/groups?organizationId=org-textile', hydroponic)).items.some(
      (item) => item.id === group.id,
    ),
  );
  const createReservoir = (name, groupId = group.id) =>
    request(
      'POST',
      '/reservoirs',
      textile,
      {
        groupId,
        name,
        code: name,
        reservoirType: 'TANK',
        location: 'Área de pruebas',
        capacityLiters: null,
      },
      201,
    );
  const reservoirA = await createReservoir('BC02-A');
  const reservoirB = await createReservoir('BC02-B');
  const reservoirC = await createReservoir('BC02-C');
  await request(
    'POST',
    '/reservoirs',
    textile,
    { groupId: 'grp-2', name: 'Ajeno', code: 'EX-1', reservoirType: 'TANK', location: 'Pruebas' },
    404,
  );
  await request(
    'POST',
    '/reservoirs',
    textile,
    {
      groupId: group.id,
      name: 'Capacidad inválida',
      code: 'INV',
      reservoirType: 'TANK',
      location: 'Pruebas',
      capacityLiters: -1,
    },
    422,
  );
  await request('PATCH', '/groups/' + group.id + '/status', textile, { status: 'INACTIVE' }, 409);
  const createDevice = (serialNumber) =>
    request(
      'POST',
      '/devices',
      textile,
      {
        serialNumber,
        alias: serialNumber,
        deviceModel: 'HydroGuard Pruebas',
        operatingEnvironment: 'SIMULATION',
        capabilities: ['PH_SENSOR', 'TEMPERATURE_SENSOR'],
      },
      201,
    );
  const registrationA = await createDevice('BC02-DEVICE-A');
  const registrationB = await createDevice('BC02-DEVICE-B');
  const registrationC = await createDevice('BC02-DEVICE-C');
  const deviceA = registrationA.device;
  const deviceB = registrationB.device;
  const deviceC = registrationC.device;
  assert.match(registrationA.activationCredential, /^hgdev_[a-f0-9]{32}$/);
  assert.equal(deviceA.identityStatus, 'ACTIVE');
  assert.equal(deviceA.lifecycleStatus, 'ACTIVE_UNLINKED');
  assert.equal(deviceA.availability, 'UNKNOWN');
  await request(
    'POST',
    '/devices',
    textile,
    {
      serialNumber: deviceA.serialNumber,
      alias: 'Duplicado',
      deviceModel: 'Mock',
      operatingEnvironment: 'SIMULATION',
      capabilities: ['PH_SENSOR'],
    },
    409,
  );
  await request(
    'POST',
    '/devices/' + deviceA.id + '/link',
    textile,
    { reservoirId: 'res-201' },
    404,
  );
  for (const [device, reservoir] of [
    [deviceA, reservoirA],
    [deviceB, reservoirB],
    [deviceC, reservoirC],
  ])
    await request(
      'POST',
      '/devices/' + device.id + '/link',
      textile,
      { reservoirId: reservoir.id },
      204,
    );
  await request(
    'POST',
    '/devices/' + deviceA.id + '/link',
    textile,
    { reservoirId: reservoirB.id },
    409,
  );
  const unlinked = (await createDevice('BC02-DEVICE-D')).device;
  await request(
    'POST',
    '/devices/' + unlinked.id + '/link',
    textile,
    { reservoirId: reservoirA.id },
    409,
  );
  const revocable = (await createDevice('BC02-DEVICE-IDENTITY')).device;
  await request('POST', '/device-identities/' + revocable.id + '/revoke', textile, {}, 204);
  assert.equal(
    (await request('GET', '/devices/' + revocable.id, textile)).device.identityStatus,
    'REVOKED',
  );
  await request('POST', '/device-identities/' + revocable.id + '/revoke', textile, {}, 409);
  await request(
    'PATCH',
    '/reservoirs/' + reservoirA.id + '/status',
    textile,
    { status: 'INACTIVE' },
    409,
  );
  const createOperator = (identifier) =>
    request(
      'POST',
      '/operators',
      textile,
      { displayName: identifier, identifier, password: 'testpassword123' },
      201,
    );
  const accountA = await createOperator('bc02.operario.a');
  const accountB = await createOperator('bc02.operario.b');
  const accountC = await createOperator('bc02.operario.c');
  await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountA.id, groupId: group.id, reservoirIds: [] },
    422,
  );
  await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountA.id, groupId: group.id, reservoirIds: [reservoirA.id, reservoirA.id] },
    422,
  );
  await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountA.id, groupId: group.id, reservoirIds: [reservoirA.id, 'res-101'] },
    409,
  );
  assert.ok(
    (await request('GET', '/available-pairs?groupId=' + group.id, textile)).some(
      (item) => item.reservoirId === reservoirA.id,
    ),
    'Un alta rechazada no debe asignar parcialmente.',
  );
  const profileA = await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountA.id, groupId: group.id, reservoirIds: [reservoirA.id, reservoirB.id] },
    201,
  );
  assert.equal(profileA.status, 'PENDING_FIRST_ACCESS');
  assert.equal(
    (await request('GET', '/devices/' + deviceA.id, textile)).device.lifecycleStatus,
    'ACTIVE_ASSIGNED',
  );
  await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountA.id, groupId: group.id, reservoirIds: [reservoirC.id] },
    409,
  );
  await request(
    'POST',
    '/operator-profiles',
    textile,
    { userId: accountB.id, groupId: group.id, reservoirIds: [reservoirA.id] },
    409,
  );
  await request('POST', '/devices/' + deviceA.id + '/unlink', textile, {}, 409);
  const race = await Promise.all(
    [accountB, accountC].map(async (account) => {
      const response = await fetch(baseUrl + '/operator-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + textile },
        body: JSON.stringify({
          userId: account.id,
          groupId: group.id,
          reservoirIds: [reservoirC.id],
        }),
      });
      return { status: response.status, body: await response.json() };
    }),
  );
  assert.deepEqual(race.map((result) => result.status).sort(), [201, 409]);
  checks += 2;
  const profileB = race.find((result) => result.status === 201).body;
  const code = await request(
    'POST',
    '/operators/' + accountA.id + '/first-access-code',
    textile,
    { operatorProfileId: profileA.id },
    201,
  );
  const summary = await request('GET', '/operators/' + accountA.id + '/access-summary', textile);
  assert.equal(summary.assignments.length, 2);
  const detailA = await request('GET', '/operator-profiles/' + profileA.id, textile);
  const assignmentA = detailA.assignments.find((item) => item.reservoirId === reservoirA.id);
  const assignmentB = detailA.assignments.find((item) => item.reservoirId === reservoirB.id);
  await request('POST', '/assignments/' + assignmentA.id + '/close', textile, {}, 204);
  assert.equal(
    (await request('GET', '/operators/' + accountA.id + '/first-access-code', textile)).status,
    'ACTIVE',
  );
  await request(
    'POST',
    '/operator-profiles/' + profileB.id + '/assignments',
    textile,
    { reservoirIds: [reservoirA.id] },
    204,
  );
  await request('POST', '/assignments/' + assignmentB.id + '/close', textile, {}, 204);
  assert.equal(
    (await request('GET', '/operators/' + accountA.id + '/first-access-code', textile)).status,
    'REVOKED',
  );
  assert.ok(
    (await request('GET', '/operator-profiles/' + profileA.id, textile)).assignments.every(
      (item) => item.status === 'CLOSED' && item.closedAt,
    ),
  );
  await request(
    'POST',
    '/operator-profiles/' + profileA.id + '/assignments',
    textile,
    { reservoirIds: [reservoirB.id] },
    204,
  );
  const replacementCode = await request(
    'POST',
    '/operators/' + accountA.id + '/first-access-code',
    textile,
    { operatorProfileId: profileA.id },
    201,
  );
  assert.notEqual(replacementCode.id, code.id);
  await request(
    'PATCH',
    '/operator-profiles/' + profileA.id + '/status',
    textile,
    { status: 'INACTIVE' },
    204,
  );
  assert.equal(
    (await request('GET', '/devices/' + deviceB.id, textile)).device.lifecycleStatus,
    'ACTIVE_UNASSIGNED',
  );
  await request(
    'POST',
    '/operator-profiles/' + profileA.id + '/assignments',
    textile,
    { reservoirIds: [reservoirB.id] },
    409,
  );
  await request('POST', '/devices/' + deviceB.id + '/unlink', textile, {}, 204);
  await request(
    'PATCH',
    '/devices/' + deviceB.id + '/status',
    textile,
    { status: 'INACTIVE' },
    204,
  );
  await request(
    'PATCH',
    '/reservoirs/' + reservoirB.id + '/status',
    textile,
    { status: 'INACTIVE' },
    204,
  );
  const versions = await request('GET', '/devices/dev-101/configurations', textile);
  assert.equal(versions.device.currentConfigurationVersion, 1);
  assert.ok(versions.versions.some((item) => item.status === 'DRAFT'));
  assert.equal(
    (await request('GET', '/devices/dev-201/configurations', hydroponic)).device
      .configurationStatus,
    'INCOMPATIBLE',
  );
  assert.equal(
    (await request('GET', '/devices/' + deviceC.id + '/configurations', textile)).device
      .configurationStatus,
    'MISSING',
  );
  await request('POST', '/devices/dev-101/configurations', textile, {}, 404);
  const emptyGroup = await request(
    'POST',
    '/groups',
    textile,
    { name: 'Grupo vacío BC02', purpose: 'Prueba de baja' },
    201,
  );
  await request(
    'PATCH',
    '/groups/' + emptyGroup.id + '/status',
    textile,
    { status: 'INACTIVE' },
    204,
  );
  assert.equal(
    (await request('GET', '/groups/' + emptyGroup.id, textile)).group.status,
    'INACTIVE',
  );
  const accountBSession = await request('POST', '/authentication/sign-in', null, {
    identifier: profileB.userId === accountB.id ? accountB.identifier : accountC.identifier,
    password: 'testpassword123',
  });
  await request(
    'PATCH',
    '/operators/' + profileB.userId + '/status',
    textile,
    { status: 'INACTIVE' },
    204,
  );
  await request('GET', '/operator-profiles/' + profileB.id, accountBSession.token, undefined, 401);
  assert.ok(
    (await request('GET', '/operator-profiles/' + profileB.id, textile)).assignments.every(
      (item) => item.status === 'CLOSED',
    ),
  );
  const persisted = JSON.parse(await readFile(databasePath, 'utf8'));
  assert.equal(persisted.operatorProfiles.filter((item) => item.userId === accountA.id).length, 1);
  assert.equal(
    persisted.deviceAssignments.filter(
      (item) => item.deviceId === deviceA.id && item.status === 'ACTIVE',
    ).length,
    0,
  );
  assert.equal(
    await readFile(sourcePath, 'utf8'),
    original,
    'La verificación no modifica la base de desarrollo.',
  );
  console.log(
    `BC-02: ${checks} comprobaciones HTTP aprobadas; exclusividad, aislamiento, persistencia e historial verificados.`,
  );
} finally {
  if (child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await Promise.race([exited, delay(5000)]);
  }
  // Solo elimina archivos conocidos del directorio temporal creado por este script.
  assert.ok(resolve(temporaryDirectory).startsWith(resolve(tmpdir()) + sep));
  await unlink(databasePath).catch(() => undefined);
  await unlink(databasePath + '.tmp').catch(() => undefined);
  await rmdir(temporaryDirectory);
}
