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
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'hydroguard-bc04-'));
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
  const operator = await login('marcelino.valencia', 'operadorpassword123');
  await request('GET', '/treatments', null, undefined, 401);
  await request('GET', '/treatments', operator, undefined, 403);
  const textileProcesses = await request(
    'GET',
    '/treatments?page=1&pageSize=10&sortBy=updatedAt&sortDirection=desc',
    textile,
  );
  assert.equal(textileProcesses.total, 3);
  assert.ok(textileProcesses.items.every((item) => item.organizationId === 'org-textile'));
  const ready = await request('GET', '/treatments?status=READY', textile);
  assert.equal(ready.total, 1);
  assert.equal(ready.items[0].id, 'trt-tx-ready');
  const detail = await request('GET', '/treatments/trt-tx-ready', textile);
  assert.equal(detail.approvalStatus, 'APPROVED');
  assert.equal(detail.releaseEligibility, 'PENDING_CONFIRMATION');
  assert.equal(detail.cycles.length, 1);
  await request('GET', '/treatments/trt-hp-failure', textile, undefined, 404);
  const hydroProcesses = await request('GET', '/treatments', hydroponic);
  assert.equal(hydroProcesses.total, 4);
  assert.ok(hydroProcesses.items.some((item) => item.state === 'PENDING_CORRECTION_APPROVAL'));
  assert.ok(hydroProcesses.items.some((item) => item.state === 'FAILED'));
  assert.ok(hydroProcesses.items.some((item) => item.state === 'EMERGENCY'));
  const pendingApproval = await request('GET', '/treatments/trt-hp-pending-approval', hydroponic);
  assert.equal(pendingApproval.approvalStatus, 'PENDING');
  assert.equal(pendingApproval.cycles.length, 0);
  const empty = await request('GET', '/treatments?searchTerm=NO-EXISTE-999', textile);
  assert.equal(empty.total, 0);
  assert.equal(await readFile(sourcePath, 'utf8'), original, 'La prueba no modifica la semilla.');
  console.log(
    `BC-04: ${checks} comprobaciones HTTP aprobadas; consulta, estados, detalle y aislamiento verificados.`,
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
