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
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'hydroguard-bc05-'));
const databasePath = join(temporaryDirectory, 'db.json');
await writeFile(databasePath, original);
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
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error('El mock terminó: ' + code)));
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
  const login = async (identifier, password = 'adminpassword123') =>
    (await request('POST', '/authentication/sign-in', null, { identifier, password })).token;
  const textile = await login('admin.textil@hydroguard.pe');
  const hydroponic = await login('admin.hidro@hydroguard.pe');
  await request('GET', '/monitoring/overview', null, undefined, 401);
  const operator = await login('marcelino.valencia', 'operadorpassword123');
  await request('GET', '/monitoring/overview', operator, undefined, 403);
  const textileOverview = await request('GET', '/monitoring/overview', textile);
  assert.equal(textileOverview.totalDevices, 3);
  assert.ok(
    textileOverview.devices.every((item) => !['dev-201', 'dev-202'].includes(item.deviceId)),
  );
  const hydroOverview = await request('GET', '/monitoring/overview', hydroponic);
  assert.ok(hydroOverview.devices.every((item) => ['dev-201', 'dev-202'].includes(item.deviceId)));
  const active = await request(
    'GET',
    '/monitoring/alerts?status=ACTIVE&severity=HIGH&page=1&pageSize=10&sortBy=createdAt&sortDirection=desc',
    textile,
  );
  assert.equal(active.items.length, 1);
  assert.equal(active.items[0].id, 'alt-tx-01');
  assert.equal(
    (
      await request('PATCH', '/monitoring/alerts/alt-tx-01/status', textile, {
        status: 'ACKNOWLEDGED',
      })
    ).status,
    'ACKNOWLEDGED',
  );
  await request(
    'PATCH',
    '/monitoring/alerts/alt-hp-01/status',
    textile,
    { status: 'ACKNOWLEDGED' },
    404,
  );
  const incident = await request(
    'POST',
    '/monitoring/incidents',
    textile,
    {
      deviceId: 'dev-101',
      incidentType: 'QUALITY_INCIDENT',
      description: 'Incidente de integración con trazabilidad comprobable.',
    },
    201,
  );
  assert.equal(incident.status, 'OPEN');
  await request(
    'POST',
    '/monitoring/incidents',
    textile,
    {
      deviceId: 'dev-201',
      incidentType: 'QUALITY_INCIDENT',
      description: 'Intento fuera de organización.',
    },
    404,
  );
  const detail = await request(
    'GET',
    '/monitoring/devices/dev-101/traceability?from=2026-09-26&to=2026-10-03',
    textile,
  );
  assert.ok(
    detail.events.some((item) => item.id === incident.id.replace('inc-', 'evt-')) ||
      detail.events.some((item) => item.correlationId === incident.correlationId),
  );
  await request('GET', '/monitoring/devices/dev-201/traceability', textile, undefined, 404);
  const report = await request(
    'POST',
    '/monitoring/reports/generate',
    textile,
    { deviceId: 'dev-101', from: '2026-09-26', to: '2026-10-03' },
    201,
  );
  assert.ok(report.measurements >= 2);
  assert.ok(report.events.length >= 4);
  await request(
    'POST',
    '/monitoring/reports/generate',
    textile,
    { deviceId: 'dev-101', from: '2025-01-01', to: '2025-01-02' },
    422,
  );
  const persisted = JSON.parse(await readFile(databasePath, 'utf8'));
  assert.ok(persisted.reports.some((item) => item.id === report.id));
  assert.ok(persisted.incidents.some((item) => item.id === incident.id));
  assert.equal(
    await readFile(sourcePath, 'utf8'),
    original,
    'La verificación no modifica la base de desarrollo.',
  );
  console.log(
    `BC-05: ${checks} comprobaciones HTTP aprobadas; aislamiento, alertas, incidentes, correlación y reportes verificados.`,
  );
} finally {
  if (child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await Promise.race([exited, delay(5000)]);
  }
  assert.ok(resolve(temporaryDirectory).startsWith(resolve(tmpdir()) + sep));
  await unlink(databasePath).catch(() => undefined);
  await unlink(databasePath + '.tmp').catch(() => undefined);
  await rmdir(temporaryDirectory);
}
