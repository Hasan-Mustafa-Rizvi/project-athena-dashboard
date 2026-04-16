import type { DashboardMode } from '@/types/telemetry';

const DEFAULT_WS_URL = 'ws://127.0.0.1:8000/ws/telemetry';

type StartupMode = DashboardMode | 'auto';

const parseStartupMode = (value: string | undefined): StartupMode => {
  const normalized = (value ?? 'auto').toLowerCase();
  if (normalized === 'live' || normalized === 'mock' || normalized === 'simulation') {
    return normalized;
  }
  return 'auto';
};

export const TELEMETRY_WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;
export const TELEMETRY_STARTUP_MODE: StartupMode = parseStartupMode(import.meta.env.VITE_TELEMETRY_MODE);
