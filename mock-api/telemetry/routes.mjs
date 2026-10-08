import { find, scoped } from '../configuration/helpers.mjs';

const latestMeasurementFor = (db, organizationId, deviceId) =>
  db.measurements
    .filter(
      (measurement) =>
        measurement.deviceId === deviceId && measurement.organizationId === organizationId,
    )
    .sort((left, right) => Date.parse(right.measuredAt) - Date.parse(left.measuredAt))[0] ?? null;

const telemetrySummary = (db, organizationId, device) => {
  const latestMeasurement = latestMeasurementFor(db, organizationId, device.id);
  const reservoir = db.reservoirs.find(
    (item) => item.id === device.reservoirId && item.organizationId === organizationId,
  );

  return {
    device: {
      id: device.id,
      serialNumber: device.serialNumber,
      alias: device.alias ?? null,
      deviceModel: device.deviceModel,
      operatingEnvironment: device.operatingEnvironment,
      availability: device.availability,
      reservoirName: reservoir?.name ?? null,
      lastCommunicationAt: device.lastCommunicationAt ?? latestMeasurement?.measuredAt ?? null,
    },
    latestMeasurement,
  };
};

/**
 * Ruta de telemetría IoT (BC-03).
 * Maneja historial paginado de mediciones, última medición y resumen agregado por organización.
 */
export const isTelemetryPath = (path) =>
  /^\/api\/v1\/devices\/[^/]+\/water-measurements(\/|$)/.test(path) ||
  /^\/api\/v1\/telemetry(\/|$)/.test(path);

export const handleTelemetry = ({ method, url, body, db, organizationId }) => {
  if (!db.measurements) {
    db.measurements = [];
  }

  const parts = url.pathname.slice('/api/v1/'.length).split('/').map(decodeURIComponent);

  // 1. Resumen de telemetría por organización (supervisión administrativa).
  // La disponibilidad es un dato informado; este mock no simula un reloj de heartbeat.
  if (parts.join('/') === 'telemetry/devices' && method === 'GET') {
    let orgDevices = scoped(db.devices, organizationId).filter(
      (d) => d.lifecycleStatus !== 'INACTIVE',
    );

    const availability = url.searchParams.get('availability');
    const operatingEnvironment = url.searchParams.get('operatingEnvironment');
    const searchTerm = (url.searchParams.get('searchTerm') || '').trim().toLowerCase();

    if (availability) {
      orgDevices = orgDevices.filter((d) => d.availability === availability);
    }
    if (operatingEnvironment) {
      orgDevices = orgDevices.filter((d) => d.operatingEnvironment === operatingEnvironment);
    }
    if (searchTerm) {
      orgDevices = orgDevices.filter(
        (d) =>
          d.serialNumber.toLowerCase().includes(searchTerm) ||
          (d.alias && d.alias.toLowerCase().includes(searchTerm)) ||
          d.deviceModel.toLowerCase().includes(searchTerm),
      );
    }

    // Ordenamiento
    const sortBy = url.searchParams.get('sortBy') || 'serialNumber';
    const direction = url.searchParams.get('sortDirection') === 'desc' ? -1 : 1;
    orgDevices.sort((left, right) => {
      const a = String(left[sortBy] ?? '');
      const b = String(right[sortBy] ?? '');
      return direction * a.localeCompare(b);
    });

    const pageNumber = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
    const start = (pageNumber - 1) * pageSize;
    const paginatedDevices = orgDevices.slice(start, start + pageSize);

    const items = paginatedDevices.map((device) => telemetrySummary(db, organizationId, device));

    return {
      status: 200,
      body: {
        items,
        total: orgDevices.length,
        page: pageNumber,
        pageSize,
      },
    };
  }

  // GET /api/v1/telemetry/devices/:deviceId
  if (
    parts[0] === 'telemetry' &&
    parts[1] === 'devices' &&
    parts.length === 3 &&
    method === 'GET'
  ) {
    const device = find(db.devices, parts[2], organizationId);
    if (device.lifecycleStatus === 'INACTIVE') {
      return { status: 404, body: { message: 'Dispositivo no encontrado.' } };
    }
    return { status: 200, body: telemetrySummary(db, organizationId, device) };
  }

  // 2. Rutas anidadas por dispositivo: /devices/:deviceId/water-measurements...
  if (parts[0] === 'devices' && parts.length >= 3 && parts[2] === 'water-measurements') {
    const deviceId = parts[1];
    const device = find(db.devices, deviceId, organizationId);

    // GET /api/v1/devices/:deviceId/water-measurements/latest
    if (parts.length === 4 && parts[3] === 'latest' && method === 'GET') {
      const measurements = db.measurements
        .filter((m) => m.deviceId === device.id && m.organizationId === organizationId)
        .sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt));

      const latest = measurements[0];
      if (!latest) {
        return {
          status: 404,
          body: { message: 'El dispositivo no posee mediciones registradas.' },
        };
      }
      return { status: 200, body: latest };
    }

    // GET /api/v1/devices/:deviceId/water-measurements (historial paginado)
    if (parts.length === 3 && method === 'GET') {
      let measurements = db.measurements.filter(
        (m) => m.deviceId === device.id && m.organizationId === organizationId,
      );

      const source = url.searchParams.get('source');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      if (source) {
        measurements = measurements.filter((m) => m.source === source);
      }
      if (from) {
        const fromTime = Date.parse(from);
        measurements = measurements.filter((m) => Date.parse(m.measuredAt) >= fromTime);
      }
      if (to) {
        const toTime = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to}T23:59:59.999Z` : to);
        measurements = measurements.filter((m) => Date.parse(m.measuredAt) <= toTime);
      }

      // Ordenamiento por fecha por defecto
      const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 1 : -1;
      const sortBy = url.searchParams.get('sortBy') || 'measuredAt';

      measurements.sort((a, b) => {
        if (sortBy === 'measuredAt') {
          return sortDirection * (Date.parse(a.measuredAt) - Date.parse(b.measuredAt));
        }
        if (sortBy === 'ph') {
          return sortDirection * (a.ph - b.ph);
        }
        if (sortBy === 'temperature') {
          return sortDirection * (a.temperature - b.temperature);
        }
        return 0;
      });

      const pageNumber = Math.max(1, Number(url.searchParams.get('page') || 1));
      const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
      const start = (pageNumber - 1) * pageSize;

      return {
        status: 200,
        body: {
          items: measurements.slice(start, start + pageSize),
          total: measurements.length,
          page: pageNumber,
          pageSize,
        },
      };
    }
  }

  return { status: 404, body: { message: 'Endpoint de telemetría no encontrado.' } };
};
