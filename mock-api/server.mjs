import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = fileURLToPath(new URL('./db.json', import.meta.url));
const sessions = new Map();

const send = (res, status, body) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-Id',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};

const readDb = async () => JSON.parse(await readFile(DB_PATH, 'utf8'));
const saveDb = async (db) => writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8');

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('El cuerpo debe ser JSON válido.'), { status: 400 });
  }
};

const publicOperator = ({ id, displayName, identifier, status, createdAt, updatedAt }) => ({
  id,
  displayName,
  identifier,
  status,
  createdAt,
  updatedAt,
});

const isAdministrator = (user) => user.role === 'ROLE_ADMIN' || user.roles?.includes('ROLE_ADMIN');

const isOperator = (user) => user.role === 'ROLE_OPERATOR' || user.roles?.includes('ROLE_OPERATOR');

const requireAuthentication = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = sessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    throw Object.assign(new Error('Sesión no autorizada o expirada.'), { status: 401 });
  }

  return { token, ...session };
};

const requireAdministrator = (authentication) => {
  if (authentication.role !== 'ADMINISTRATOR') {
    throw Object.assign(new Error('La operación requiere una cuenta administradora.'), {
      status: 403,
    });
  }
  return authentication;
};

const findOperator = (db, operatorId, organizationId) =>
  db.users.find(
    (user) => user.id === operatorId && user.organizationId === organizationId && isOperator(user),
  );

const createAccessSummary = (db, operatorId, organizationId) => {
  const profile = db.operatorProfiles.find(
    (item) => item.userId === operatorId && item.organizationId === organizationId,
  );
  const group = profile
    ? db.groups.find(
        (item) => item.id === profile.groupId && item.organizationId === organizationId,
      )
    : null;
  const assignments = profile
    ? db.deviceAssignments
        .filter(
          (item) => item.operatorProfileId === profile.id && item.organizationId === organizationId,
        )
        .map((item) => ({
          assignmentId: item.id,
          reservoirId: item.reservoirId,
          reservoirName: item.reservoirName,
          deviceId: item.deviceId,
          deviceSerialNumber: item.deviceSerialNumber,
          status: item.status,
        }))
    : [];

  return {
    operatorAccountId: operatorId,
    operatorProfileId: profile?.id ?? null,
    profileStatus: profile?.status ?? null,
    groupId: group?.id ?? null,
    groupName: group?.name ?? null,
    assignments,
  };
};

const latestCode = (db, operatorId, organizationId, profileId) =>
  db.firstAccessCodes
    .filter(
      (item) =>
        item.organizationId === organizationId &&
        item.operatorAccountId === operatorId &&
        (!profileId || item.operatorProfileId === profileId),
    )
    .sort((left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt))[0];

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);

  try {
    const url = new URL(req.url, 'http://' + req.headers.host);
    const path = url.pathname;

    if (req.method === 'GET' && (path === '/' || path === '/api/v1/health')) {
      return send(res, 200, {
        name: 'HydroGuard IAM Mock API',
        status: 'UP',
        baseUrl: `http://127.0.0.1:${PORT}/api/v1`,
        frontendUrl: 'http://127.0.0.1:4200',
        message: 'El mock está activo. La interfaz web se ejecuta en el puerto 4200.',
      });
    }

    const db = await readDb();

    if (req.method === 'POST' && path === '/api/v1/organization-registrations') {
      const body = await readBody(req);
      const organizationData = body.organization || {};
      const administratorData = body.administrator || {};
      const organizationName = String(organizationData.name || '').trim();
      const ruc = String(organizationData.ruc || '').trim();
      const phone = String(organizationData.phone || '').trim();
      const segment = String(organizationData.segment || '');
      const displayName = String(administratorData.displayName || '').trim();
      const email = String(administratorData.email || '')
        .trim()
        .toLowerCase();
      const password = String(administratorData.password || '');

      if (
        organizationName.length < 3 ||
        !/^\d{11}$/.test(ruc) ||
        !/^\+?[1-9]\d{8,14}$/.test(phone) ||
        !['HYDROPONIC', 'TEXTILE'].includes(segment) ||
        displayName.length < 3 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 8
      ) {
        return send(res, 422, {
          message: 'Los datos de la empresa o del administrador no cumplen las reglas.',
        });
      }

      db.organizations ||= [];
      if (db.organizations.some((item) => item.ruc === ruc)) {
        return send(res, 409, { message: 'El RUC ya está registrado.' });
      }
      if (db.users.some((user) => user.identifier.toLowerCase() === email)) {
        return send(res, 409, { message: 'El correo ya está registrado.' });
      }

      const now = new Date().toISOString();
      const organizationId = 'org-' + randomUUID();
      const organization = {
        id: organizationId,
        name: organizationName,
        ruc,
        phone,
        segment,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      const administrator = {
        id: 'usr-' + randomUUID(),
        organizationId,
        identifier: email,
        username: email,
        email,
        displayName,
        password,
        role: 'ROLE_ADMIN',
        roles: ['ROLE_ADMIN'],
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };

      db.organizations.push(organization);
      db.users.push(administrator);
      await saveDb(db);

      return send(res, 201, {
        organization: {
          id: organization.id,
          name: organization.name,
          ruc: organization.ruc,
          phone: organization.phone,
          segment: organization.segment,
        },
        administrator: {
          id: administrator.id,
          displayName: administrator.displayName,
          email: administrator.email,
          role: 'ADMINISTRATOR',
        },
      });
    }

    if (req.method === 'POST' && path === '/api/v1/authentication/sign-in') {
      const body = await readBody(req);
      const identifier = String(body.identifier || '')
        .trim()
        .toLowerCase();
      const user = db.users.find((item) => item.identifier.toLowerCase() === identifier);

      if (!user || user.password !== body.password) {
        return send(res, 401, { message: 'Correo o contraseña incorrectos.' });
      }
      if (user.status !== 'ACTIVE') {
        return send(res, 403, { message: 'La cuenta se encuentra inactiva.' });
      }

      const token = 'mock-' + randomUUID();
      const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
      const role = isAdministrator(user) ? 'ADMINISTRATOR' : 'OPERATOR';
      sessions.set(token, {
        userId: user.id,
        organizationId: user.organizationId,
        role,
        expiresAt,
      });

      return send(res, 200, {
        id: user.id,
        identifier: user.identifier,
        organizationId: user.organizationId,
        token,
        role,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }

    const authentication = requireAuthentication(req);

    if (req.method === 'POST' && path === '/api/v1/authentication/sign-out') {
      sessions.delete(authentication.token);
      return send(res, 204);
    }

    const { organizationId } = requireAdministrator(authentication);

    if (req.method === 'GET' && path === '/api/v1/operators') {
      const searchTerm = (url.searchParams.get('searchTerm') || '').trim().toLowerCase();
      const status = url.searchParams.get('status');
      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
      let operators = db.users.filter(
        (item) => item.organizationId === organizationId && isOperator(item),
      );
      if (status) operators = operators.filter((item) => item.status === status);
      if (searchTerm) {
        operators = operators.filter(
          (item) =>
            item.displayName.toLowerCase().includes(searchTerm) ||
            item.identifier.toLowerCase().includes(searchTerm),
        );
      }
      const total = operators.length;
      const start = (page - 1) * pageSize;
      return send(res, 200, {
        items: operators.slice(start, start + pageSize).map(publicOperator),
        total,
        page,
        pageSize,
      });
    }

    if (req.method === 'POST' && path === '/api/v1/operators') {
      const body = await readBody(req);
      const displayName = String(body.displayName || '').trim();
      const identifier = String(body.identifier || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      if (displayName.length < 3 || identifier.length < 3 || password.length < 6) {
        return send(res, 422, {
          message: 'Nombre, identificador o contraseña no cumplen las reglas.',
        });
      }
      if (!/^[a-z0-9._-]+$/.test(identifier)) {
        return send(res, 422, { message: 'El identificador contiene caracteres no permitidos.' });
      }
      if (db.users.some((item) => item.identifier.toLowerCase() === identifier)) {
        return send(res, 409, { message: 'El identificador ya está registrado.' });
      }
      const now = new Date().toISOString();
      const user = {
        id: 'usr-' + randomUUID(),
        organizationId,
        identifier,
        username: identifier,
        displayName,
        password,
        role: 'ROLE_OPERATOR',
        roles: ['ROLE_OPERATOR'],
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(user);
      await saveDb(db);
      return send(res, 201, publicOperator(user));
    }

    const operatorMatch = path.match(/^\/api\/v1\/operators\/([^/]+)$/);
    if (req.method === 'GET' && operatorMatch) {
      const operator = findOperator(db, decodeURIComponent(operatorMatch[1]), organizationId);
      return operator
        ? send(res, 200, publicOperator(operator))
        : send(res, 404, { message: 'Operario no encontrado.' });
    }

    const statusMatch = path.match(/^\/api\/v1\/operators\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
      const operator = findOperator(db, decodeURIComponent(statusMatch[1]), organizationId);
      if (!operator) return send(res, 404, { message: 'Operario no encontrado.' });
      const body = await readBody(req);
      if (body.status !== 'INACTIVE') {
        return send(res, 422, { message: 'El único cambio admitido es la baja lógica.' });
      }
      operator.status = 'INACTIVE';
      operator.updatedAt = new Date().toISOString();
      const profile = db.operatorProfiles.find(
        (item) => item.userId === operator.id && item.organizationId === organizationId,
      );
      if (profile) profile.status = 'INACTIVE';
      await saveDb(db);
      return send(res, 204);
    }

    const summaryMatch = path.match(/^\/api\/v1\/operators\/([^/]+)\/access-summary$/);
    if (req.method === 'GET' && summaryMatch) {
      const operatorId = decodeURIComponent(summaryMatch[1]);
      if (!findOperator(db, operatorId, organizationId)) {
        return send(res, 404, { message: 'Operario no encontrado.' });
      }
      return send(res, 200, createAccessSummary(db, operatorId, organizationId));
    }

    const codeMatch = path.match(/^\/api\/v1\/operators\/([^/]+)\/first-access-code$/);
    if (req.method === 'GET' && codeMatch) {
      const operatorId = decodeURIComponent(codeMatch[1]);
      if (!findOperator(db, operatorId, organizationId)) {
        return send(res, 404, { message: 'Operario no encontrado.' });
      }
      const code = latestCode(
        db,
        operatorId,
        organizationId,
        url.searchParams.get('operatorProfileId'),
      );
      return code
        ? send(res, 200, code)
        : send(res, 404, { message: 'Código de primer acceso no encontrado.' });
    }

    if (req.method === 'POST' && codeMatch) {
      const operatorId = decodeURIComponent(codeMatch[1]);
      const operator = findOperator(db, operatorId, organizationId);
      if (!operator) return send(res, 404, { message: 'Operario no encontrado.' });
      if (operator.status !== 'ACTIVE') {
        return send(res, 409, { message: 'La cuenta del operario está inactiva.' });
      }
      const body = await readBody(req);
      const summary = createAccessSummary(db, operatorId, organizationId);
      if (
        !summary.operatorProfileId ||
        summary.operatorProfileId !== body.operatorProfileId ||
        summary.profileStatus !== 'PENDING_FIRST_ACCESS' ||
        !summary.groupId ||
        !summary.assignments.some((item) => item.status === 'ACTIVE')
      ) {
        return send(res, 409, { message: 'No se cumplen las precondiciones de primer acceso.' });
      }
      const current = latestCode(db, operatorId, organizationId, summary.operatorProfileId);
      if (current?.status === 'ACTIVE' || current?.status === 'USED') {
        return send(res, 409, { message: 'El perfil ya posee un código activo o utilizado.' });
      }
      const code = {
        id: 'code-' + randomUUID(),
        organizationId,
        code: 'HG-' + randomBytes(3).toString('hex').toUpperCase(),
        status: 'ACTIVE',
        operatorProfileId: summary.operatorProfileId,
        operatorAccountId: operatorId,
        userId: operatorId,
        generatedAt: new Date().toISOString(),
      };
      db.firstAccessCodes.push(code);
      await saveDb(db);
      return send(res, 201, code);
    }

    const revokeMatch = path.match(/^\/api\/v1\/first-access-codes\/([^/]+)\/revoke$/);
    if (req.method === 'POST' && revokeMatch) {
      const code = db.firstAccessCodes.find(
        (item) =>
          item.id === decodeURIComponent(revokeMatch[1]) && item.organizationId === organizationId,
      );
      if (!code) return send(res, 404, { message: 'Código no encontrado.' });
      if (code.status !== 'ACTIVE') {
        return send(res, 409, { message: 'Solo puede revocarse un código activo.' });
      }
      code.status = 'REVOKED';
      code.revokedAt = new Date().toISOString();
      await saveDb(db);
      return send(res, 204);
    }

    return send(res, 404, { message: 'Endpoint no encontrado.' });
  } catch (error) {
    const status = Number(error.status || 500);
    return send(res, status, {
      message: status === 500 ? 'Error interno del servidor mock.' : error.message,
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('HydroGuard IAM mock disponible en http://127.0.0.1:' + PORT + '/api/v1');
});
