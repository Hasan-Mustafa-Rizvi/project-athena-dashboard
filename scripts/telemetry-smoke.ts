import samplePayload from './samples/backend-telemetry.sample.json';
import { parseTelemetryPayload } from '../src/adapters/telemetryAdapter';

const parsed = parseTelemetryPayload(samplePayload);

if (!parsed) {
  throw new Error('Telemetry smoke test failed: sample payload is incompatible with frontend adapter contract.');
}

const checks = [
  parsed.vehicle.connection.status === 'connected',
  parsed.vehicle.flight.mode === 'CRUISE',
  parsed.vehicle.flight.system_status === 'nominal',
  typeof parsed.attitude.heading_deg === 'number',
  typeof parsed.power.battery_pct === 'number',
];

if (checks.some((passed) => !passed)) {
  throw new Error('Telemetry smoke test failed: parsed payload values drifted from expected contract.');
}

console.log('Telemetry smoke test passed: frontend contract matches representative backend payload.');
