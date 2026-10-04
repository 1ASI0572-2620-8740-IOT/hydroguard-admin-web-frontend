import { randomUUID } from 'node:crypto';
import {
  createRecord,
  enumField,
  fail,
  find,
  page,
  rejectScopeOverride,
  scoped,
  textField,
} from '../configuration/helpers.mjs';

export const isMonitoringPath = (path) => /^\/api\/v1\/monitoring(\/|$)/.test(path);

const deviceContext = (db, device, organizationId) => {
  const reservoir = db.reservoirs.find(
    (item) => item.id === device.reservoirId && item.organizationId === organizationId,
  );
  const assignment = db.deviceAssignments.find(
    (item) =>
      item.deviceId === device.id &&
      item.organizationId === organizationId &&
      item.status === 'ACTIVE',
  );
  const profile =
    assignment && db.operatorProfiles.find((item) => item.id === assignment.operatorProfileId);
  const operator = profile && db.users.find((item) => item.id === profile.userId);
  return {
    reservoirName: reservoir?.name ?? 'Sin reservorio',
    operatorName: operator?.displayName ?? null,
  };
};

const alertView = (db, alert, organizationId) => {
  const device = find(db.devices, alert.deviceId, organizationId);
  const context = deviceContext(db, device, organizationId);
  return {
    ...alert,
    deviceSerialNumber: device.serialNumber,
    reservoirName: context.reservoirName,
    attendedAt: alert.attendedAt ?? null,
  };
};

const incidentView = (db, incident, organizationId) => {
  const device = find(db.devices, incident.deviceId, organizationId);
  const context = deviceContext(db, device, organizationId);
  return {
    ...incident,
    deviceSerialNumber: device.serialNumber,
    reservoirName: context.reservoirName,
    correlationId: incident.correlationId ?? null,
    closedAt: incident.closedAt ?? null,
  };
};

const statusView = (db, device, organizationId) => {
  const measurements = scoped(db.measurements ?? [], organizationId)
    .filter((item) => item.deviceId === device.id)
    .sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt));
  const measurement = measurements[0];
  const process = scoped(db.processes ?? [], organizationId)
    .filter((item) => item.deviceId === device.id)
    .sort(
      (a, b) => Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt),
    )[0];
  const context = deviceContext(db, device, organizationId);
  const activeAlertCount = scoped(db.alerts ?? [], organizationId).filter(
    (item) => item.deviceId === device.id && item.status === 'ACTIVE',
  ).length;
  return {
    deviceId: device.id,
    serialNumber: device.serialNumber,
    alias: device.alias ?? '',
    ...context,
    availability: device.availability ?? 'UNKNOWN',
    processState: process?.state ?? 'READING',
    statusView:
      !measurement || ['DELAYED', 'OFFLINE', 'UNKNOWN'].includes(device.availability)
        ? 'OUTDATED'
        : 'UPDATED',
    ph: measurement?.ph ?? null,
    temperature: measurement?.temperature ?? null,
    measuredAt: measurement?.measuredAt ?? null,
    activeAlertCount,
  };
};

const within = (timestamp, from, to) => {
  const value = Date.parse(timestamp);
  return (
    (!from || value >= Date.parse(`${from}T00:00:00.000Z`)) &&
    (!to || value <= Date.parse(`${to}T23:59:59.999Z`))
  );
};

export const handleMonitoring = ({ method, url, body, db, organizationId }) => {
  db.alerts ||= [];
  db.incidents ||= [];
  db.traceabilityEntries ||= [];
  db.reports ||= [];
  db.measurements ||= [];
  db.processes ||= [];
  const path = url.pathname;

  if (method === 'GET' && path === '/api/v1/monitoring/overview') {
    const devices = scoped(db.devices, organizationId)
      .filter((item) => item.lifecycleStatus !== 'INACTIVE')
      .map((item) => statusView(db, item, organizationId));
    const activeAlerts = scoped(db.alerts, organizationId)
      .filter((item) => item.status === 'ACTIVE')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return {
      status: 200,
      body: {
        totalDevices: devices.length,
        onlineDevices: devices.filter((item) => item.availability === 'ONLINE').length,
        devicesRequiringAttention: devices.filter(
          (item) =>
            item.statusView === 'OUTDATED' ||
            item.processState === 'FAILURE' ||
            item.activeAlertCount > 0,
        ).length,
        activeAlerts: activeAlerts.length,
        openIncidents: scoped(db.incidents, organizationId).filter(
          (item) => item.status !== 'CLOSED',
        ).length,
        devices,
        recentAlerts: activeAlerts.slice(0, 5).map((item) => alertView(db, item, organizationId)),
      },
    };
  }

  if (method === 'GET' && path === '/api/v1/monitoring/alerts') {
    const severity = url.searchParams.get('severity');
    let alerts = scoped(db.alerts, organizationId).map((item) =>
      alertView(db, item, organizationId),
    );
    if (severity) alerts = alerts.filter((item) => item.severity === severity);
    return {
      status: 200,
      body: page(alerts, url.searchParams, [
        'createdAt',
        'deviceSerialNumber',
        'reservoirName',
        'description',
        'source',
      ]),
    };
  }

  const alertStatus = path.match(/^\/api\/v1\/monitoring\/alerts\/([^/]+)\/status$/);
  if (method === 'PATCH' && alertStatus) {
    rejectScopeOverride(body);
    enumField(body, 'status', ['ACKNOWLEDGED']);
    const alert = find(db.alerts, decodeURIComponent(alertStatus[1]), organizationId);
    if (alert.status !== 'ACTIVE')
      fail(409, 'Solo una alerta activa puede marcarse como atendida.');
    alert.status = 'ACKNOWLEDGED';
    alert.attendedAt = new Date().toISOString();
    alert.updatedAt = alert.attendedAt;
    return { status: 200, body: alertView(db, alert, organizationId), changed: true };
  }

  if (method === 'GET' && path === '/api/v1/monitoring/incidents') {
    const type = url.searchParams.get('type');
    let incidents = scoped(db.incidents, organizationId).map((item) =>
      incidentView(db, item, organizationId),
    );
    if (type) incidents = incidents.filter((item) => item.incidentType === type);
    return {
      status: 200,
      body: page(incidents, url.searchParams, [
        'createdAt',
        'deviceSerialNumber',
        'reservoirName',
        'description',
        'incidentType',
      ]),
    };
  }

  if (method === 'POST' && path === '/api/v1/monitoring/incidents') {
    rejectScopeOverride(body);
    const device = find(db.devices, String(body.deviceId ?? ''), organizationId);
    const incidentType = enumField(body, 'incidentType', ['QUALITY_INCIDENT', 'MONITORING_LOSS']);
    const description = textField(body, 'description', 10, 200);
    const correlationId = `corr-${randomUUID()}`;
    const incident = createRecord('inc', organizationId, {
      deviceId: device.id,
      incidentType,
      description,
      status: 'OPEN',
      correlationId,
      closedAt: null,
    });
    db.incidents.push(incident);
    db.traceabilityEntries.push(
      createRecord('evt', organizationId, {
        deviceId: device.id,
        correlationId,
        cycleId: null,
        eventType: 'INCIDENT_REGISTERED',
        title: 'Incidente registrado',
        description,
        actor: 'Administrador',
        outcome: 'WARNING',
        ph: null,
        temperature: null,
        occurredAt: incident.createdAt,
      }),
    );
    return { status: 201, body: incidentView(db, incident, organizationId), changed: true };
  }

  const traceability = path.match(/^\/api\/v1\/monitoring\/devices\/([^/]+)\/traceability$/);
  if (method === 'GET' && traceability) {
    const device = find(db.devices, decodeURIComponent(traceability[1]), organizationId);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const events = scoped(db.traceabilityEntries, organizationId)
      .filter((item) => item.deviceId === device.id && within(item.occurredAt, from, to))
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
    return { status: 200, body: { device: statusView(db, device, organizationId), events } };
  }

  if (method === 'POST' && path === '/api/v1/monitoring/reports/generate') {
    rejectScopeOverride(body);
    const device = find(db.devices, String(body.deviceId ?? ''), organizationId);
    const from = String(body.from ?? '');
    const to = String(body.to ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to)
      fail(422, 'El periodo del reporte no es válido.');
    const events = scoped(db.traceabilityEntries, organizationId)
      .filter((item) => item.deviceId === device.id && within(item.occurredAt, from, to))
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    if (!events.length) fail(422, 'No existe información suficiente para generar el reporte.');
    const context = deviceContext(db, device, organizationId);
    const report = createRecord('rep', organizationId, {
      deviceId: device.id,
      deviceSerialNumber: device.serialNumber,
      reservoirName: context.reservoirName,
      from,
      to,
      generatedAt: new Date().toISOString(),
      measurements: events.filter((item) => item.eventType === 'MEASUREMENT_RECORDED').length,
      correctionCycles: new Set(events.map((item) => item.cycleId).filter(Boolean)).size,
      alerts: events.filter((item) => item.eventType === 'ALERT_CREATED').length,
      incidents: events.filter((item) => item.eventType === 'INCIDENT_REGISTERED').length,
      releases: events.filter((item) => item.eventType === 'RELEASE_AUTHORIZED').length,
      events,
    });
    db.reports.push(report);
    return { status: 201, body: report, changed: true };
  }
  return { status: 404, body: { message: 'Endpoint de monitoreo no encontrado.' } };
};
