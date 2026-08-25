import type { TelemetryPayload } from '@/types/telemetry';

const CONNECTION_STATES = new Set(['connected', 'degraded', 'disconnected']);
const FLIGHT_MODES = new Set(['STABILIZE', 'AUTO_LEVEL', 'CRUISE', 'LOITER', 'RTL']);
const SYSTEM_STATUSES = new Set(['nominal', 'caution', 'warning']);
const TELEMETRY_SOURCES = new Set(['frontend-mock', 'frontend-simulation', 'backend-mock', 'hardware', 'unknown']);
const CALIBRATION_STATUSES = new Set(['calibrating', 'ready', 'unknown']);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

const normalizeHeading = (value: number): number => {
  const normalized = value % 360;
  return normalized >= 0 ? normalized : normalized + 360;
};

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

/**
 * Parses and normalizes backend telemetry packets.
 * Returns null when payload shape or enum values drift from contract.
 */
export const parseTelemetryPayload = (raw: unknown): TelemetryPayload | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const vehicle = raw.vehicle;
  const attitude = raw.attitude;
  const altitude = raw.altitude;
  const power = raw.power;
  const health = raw.health;

  if (!isRecord(vehicle) || !isRecord(attitude) || !isRecord(altitude) || !isRecord(power) || !isRecord(health)) {
    return null;
  }

  const connection = vehicle.connection;
  const flight = vehicle.flight;
  if (!isRecord(connection) || !isRecord(flight)) {
    return null;
  }

  if (
    typeof raw.schema_version !== 'string' ||
    typeof raw.timestamp !== 'string' ||
    typeof vehicle.id !== 'string' ||
    typeof connection.status !== 'string' ||
    typeof flight.mode !== 'string' ||
    typeof flight.system_status !== 'string'
  ) {
    return null;
  }

  if (
    !CONNECTION_STATES.has(connection.status) ||
    !FLIGHT_MODES.has(flight.mode) ||
    !SYSTEM_STATUSES.has(flight.system_status)
  ) {
    return null;
  }

  const sequence = asFiniteNumber(raw.sequence);
  const roll = asFiniteNumber(attitude.roll_deg);
  const pitch = asFiniteNumber(attitude.pitch_deg);
  const heading = asFiniteNumber(attitude.heading_deg);
  const relativeAltitude = asFiniteNumber(altitude.relative_m);
  const verticalSpeed = asFiniteNumber(altitude.vertical_speed_mps);
  const batteryPct = asFiniteNumber(power.battery_pct);
  const signalStrength = asFiniteNumber(connection.signal_strength_pct);
  const temperature = asFiniteNumber(health.temperature_c);
  const imuQuality = asFiniteNumber(health.imu_quality_pct);

  if (
    sequence === null ||
    roll === null ||
    pitch === null ||
    heading === null ||
    relativeAltitude === null ||
    verticalSpeed === null ||
    signalStrength === null ||
    temperature === null ||
    imuQuality === null
  ) {
    return null;
  }

  return {
    schema_version: raw.schema_version,
    timestamp: raw.timestamp,
    sequence: Math.max(0, Math.trunc(sequence)),
    vehicle: {
      id: vehicle.id,
      connection: {
        status: connection.status as TelemetryPayload['vehicle']['connection']['status'],
        signal_strength_pct: clamp(signalStrength, 0, 100),
      },
      flight: {
        mode: flight.mode as TelemetryPayload['vehicle']['flight']['mode'],
        system_status: flight.system_status as TelemetryPayload['vehicle']['flight']['system_status'],
      },
    },
    attitude: {
      roll_deg: roll,
      pitch_deg: pitch,
      heading_deg: normalizeHeading(heading),
    },
    altitude: {
      relative_m: relativeAltitude,
      vertical_speed_mps: verticalSpeed,
    },
    power: {
      battery_pct: batteryPct === null ? null : clamp(batteryPct, 0, 100),
    },
    health: {
      temperature_c: temperature,
      imu_quality_pct: clamp(imuQuality, 0, 100),
    },
    telemetry_source:
      typeof raw.telemetry_source === 'string' && TELEMETRY_SOURCES.has(raw.telemetry_source)
        ? (raw.telemetry_source as TelemetryPayload['telemetry_source'])
        : undefined,
    heading_is_estimated: typeof raw.heading_is_estimated === 'boolean' ? raw.heading_is_estimated : undefined,
    altitude_is_relative: typeof raw.altitude_is_relative === 'boolean' ? raw.altitude_is_relative : undefined,
    battery_available: typeof raw.battery_available === 'boolean' ? raw.battery_available : undefined,
    calibration_status:
      typeof raw.calibration_status === 'string' && CALIBRATION_STATUSES.has(raw.calibration_status)
        ? (raw.calibration_status as TelemetryPayload['calibration_status'])
        : undefined,
    calibration_samples: asFiniteNumber(raw.calibration_samples) ?? undefined,
    sensor_status:
      isRecord(raw.sensor_status)
        ? {
            imu_ok: typeof raw.sensor_status.imu_ok === 'boolean' ? raw.sensor_status.imu_ok : undefined,
            baro_ok: typeof raw.sensor_status.baro_ok === 'boolean' ? raw.sensor_status.baro_ok : undefined,
            serial_connected:
              typeof raw.sensor_status.serial_connected === 'boolean' ? raw.sensor_status.serial_connected : undefined,
          }
        : undefined,
  };
};
