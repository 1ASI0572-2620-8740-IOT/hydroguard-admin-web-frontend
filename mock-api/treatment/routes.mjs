import { find, page, scoped } from '../configuration/helpers.mjs';

export const isTreatmentPath = (path) => /^\/api\/v1\/treatments(\/|$)/.test(path);

const summary = (process) => ({
  id: process.id,
  organizationId: process.organizationId,
  deviceId: process.deviceId,
  deviceSerialNumber: process.deviceSerialNumber,
  reservoirName: process.reservoirName,
  operatorName: process.operatorName ?? null,
  state: process.state,
  strategy: process.strategy ?? null,
  approvalStatus: process.approvalStatus,
  currentCycle: process.currentCycle,
  maximumCycles: process.maximumCycles,
  releaseMode: process.releaseMode,
  releaseEligibility: process.releaseEligibility,
  latestMeasurement: process.latestMeasurement,
  startedAt: process.startedAt,
  updatedAt: process.updatedAt,
});

export const handleTreatment = ({ method, url, db, organizationId }) => {
  db.treatmentProcesses ||= [];
  const path = url.pathname;

  if (method === 'GET' && path === '/api/v1/treatments') {
    const candidates = scoped(db.treatmentProcesses, organizationId).map((process) => ({
      ...summary(process),
      status: process.state,
    }));
    const result = page(candidates, url.searchParams, [
      'updatedAt',
      'deviceSerialNumber',
      'reservoirName',
      'operatorName',
      'strategy',
    ]);
    result.items = result.items.map(({ status: _status, ...process }) => process);
    return { status: 200, body: result };
  }

  const detail = path.match(/^\/api\/v1\/treatments\/([^/]+)$/);
  if (method === 'GET' && detail) {
    return {
      status: 200,
      body: find(db.treatmentProcesses, decodeURIComponent(detail[1]), organizationId),
    };
  }

  return { status: 404, body: { message: 'Endpoint de tratamiento no encontrado.' } };
};
