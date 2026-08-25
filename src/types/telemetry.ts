/**
 * Project Athena - Telemetry Types
 * 
 * These types match the FastAPI WebSocket payload contract.
 * Backend endpoint: ws://127.0.0.1:8000/ws/telemetry
 */

export interface VehicleConnection {
  status: 'connected' | 'degraded' | 'disconnected';
  signal_strength_pct: number;
}

export interface VehicleFlight {
  mode: 'STABILIZE' | 'AUTO_LEVEL' | 'CRUISE' | 'LOITER' | 'RTL';
  system_status: 'nominal' | 'caution' | 'warning';
}

export interface Vehicle {
  id: string;
  connection: VehicleConnection;
  flight: VehicleFlight;
}

export interface Attitude {
  roll_deg: number;
  pitch_deg: number;
  heading_deg: number;
}

export interface Altitude {
  relative_m: number;
  vertical_speed_mps: number;
}

export interface Power {
  battery_pct: number | null;
}

export interface Health {
  temperature_c: number;
  imu_quality_pct: number;
}

export interface TelemetryPayload {
  schema_version: string;
  timestamp: string;
  sequence: number;
  vehicle: Vehicle;
  attitude: Attitude;
  altitude: Altitude;
  power: Power;
  health: Health;
  telemetry_source?: 'frontend-mock' | 'frontend-simulation' | 'backend-mock' | 'hardware' | 'unknown';
  heading_is_estimated?: boolean;
  altitude_is_relative?: boolean;
  battery_available?: boolean;
  calibration_status?: 'calibrating' | 'ready' | 'unknown';
  calibration_samples?: number;
  sensor_status?: {
    imu_ok?: boolean;
    baro_ok?: boolean;
    serial_connected?: boolean;
  };
}

// Console log entry type
export interface ConsoleEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  sequence?: number;
}

// Connection state for UI
export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

// Dashboard mode
export type DashboardMode = 'live' | 'simulation' | 'mock';
