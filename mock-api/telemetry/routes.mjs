import { find, page, scoped } from '../configuration/helpers.mjs';

/**
 * Ruta de telemetría IoT (BC-03).
 * Maneja historial paginado de mediciones, última medición y resumen agregado por organización.
 */
export const isTelemetryPath = (path) =>
  /^\/api\/v1\/devices\/[^/]+\/water-measurements(\/|$)/.test(path) ||
  /^\/api\/v1\/devices\/telemetry-summaries(\/|$)/.test(path) ||
  /^\/api\/v1\/telemetry(\/|$)/.test(path);

export const handleTelemetry = ({ method, url, body, db, organizationId }) => {
  if (!db.measurements) {
    db.measurements = [];
  }

  const parts = url.pathname.slice('/api/v1/'.length).split('/').map(decodeURIComponent);

  // 1. Resumen de telemetría por organización (Supervisión General)
  // GET /api/v1/devices/telemetry-summaries
  // NOTA: Endpoint agregado para la vista administrativa web; simula heartbeat y disponibilidad
  // calculada a nivel de organización mientras el backend unifica esta consulta.
  if (
    (parts.join('/') === 'devices/telemetry-summaries' || parts.join('/') === 'telemetry/devices') &&
    method === 'GET'
  ) {
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

    // Mapear cada dispositivo con su última medición y regla de heartbeat
    const items = paginatedDevices.map((device) => {
      const measurements = db.measurements
        .filter((m) => m.deviceId === device.id && m.organizationId === organizationId)
        .sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt));

      const latestMeasurement = measurements[0] ?? null;

      // SIMULACIÓN: Intervalo estándar de 60 segundos para heartbeat (según Bounded Context Canvas)
      const heartbeatIntervalSeconds = 60;

      return {
        device: {
          id: device.id,
          serialNumber: device.serialNumber,
          alias: device.alias,
          deviceModel: device.deviceModel,
          operatingEnvironment: device.operatingEnvironment,
          capabilities: device.capabilities ?? [
            'PH_SENSOR',
            'TEMPERATURE_SENSOR',
            'RELEASE_VALVE',
          ],
          lifecycleStatus: device.lifecycleStatus,
          availability: device.availability,
          reservoirId: device.reservoirId ?? null,
          lastCommunicationAt: device.lastCommunicationAt ?? (latestMeasurement?.measuredAt ?? null),
          configurationStatus: device.configurationStatus ?? 'COMPATIBLE',
          currentConfigurationVersion: device.currentConfigurationVersion ?? 1,
        },
        latestMeasurement,
        heartbeatIntervalSeconds,
      };
    });

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
        const toTime = Date.parse(to);
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
