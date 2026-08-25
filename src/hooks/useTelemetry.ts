/**
 * Project Athena - Telemetry Hook
 * 
 * Manages WebSocket connection to the backend telemetry stream.
 * Falls back to mock data when connection is unavailable.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  TelemetryPayload, 
  ConnectionState, 
  DashboardMode,
  ConsoleEntry 
} from '@/types/telemetry';
import { TELEMETRY_STARTUP_MODE, TELEMETRY_WS_URL } from '@/config/telemetry';
import { parseTelemetryPayload } from '@/adapters/telemetryAdapter';

// Initial telemetry state
const initialTelemetry: TelemetryPayload = {
  schema_version: '1.0.0',
  timestamp: new Date().toISOString(),
  sequence: 0,
  vehicle: {
    id: 'ATHENA-SIM-001',
    connection: {
      status: 'disconnected',
      signal_strength_pct: 0,
    },
    flight: {
      mode: 'STABILIZE',
      system_status: 'nominal',
    },
  },
  attitude: {
    roll_deg: 0,
    pitch_deg: 0,
    heading_deg: 0,
  },
  altitude: {
    relative_m: 0,
    vertical_speed_mps: 0,
  },
  power: {
    battery_pct: 100,
  },
  health: {
    temperature_c: 25,
    imu_quality_pct: 100,
  },
  telemetry_source: 'frontend-mock',
  heading_is_estimated: false,
  altitude_is_relative: true,
  battery_available: true,
  calibration_status: 'ready',
  calibration_samples: 0,
  sensor_status: {
    imu_ok: true,
    baro_ok: true,
    serial_connected: true,
  },
};

export interface UseTelemetryReturn {
  telemetry: TelemetryPayload;
  connectionState: ConnectionState;
  mode: DashboardMode;
  consoleEntries: ConsoleEntry[];
  setMode: (mode: DashboardMode) => void;
  reconnect: () => void;
}

export function useTelemetry(): UseTelemetryReturn {
  const [telemetry, setTelemetry] = useState<TelemetryPayload>(initialTelemetry);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [mode, setModeState] = useState<DashboardMode>(
    TELEMETRY_STARTUP_MODE === 'auto' ? 'live' : TELEMETRY_STARTUP_MODE
  );
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef(0);
  // Session start, so the simulated battery drain is measured from the first generated
  // frame rather than from the absolute epoch clock (which would pin it at the floor).
  // Initialised lazily inside the generator so render stays pure.
  const startedAtRef = useRef<number | null>(null);
  const desiredModeRef = useRef<DashboardMode>(
    TELEMETRY_STARTUP_MODE === 'auto' ? 'live' : TELEMETRY_STARTUP_MODE
  );
  const teardownRef = useRef(false);

  const disposeSocket = useCallback((socket: WebSocket | null, reason = 'socket-dispose') => {
    if (!socket) {
      return;
    }
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000, reason);
    }
  }, []);

  const closeActiveSocket = useCallback((reason = 'socket-close') => {
    const socket = wsRef.current;
    wsRef.current = null;
    disposeSocket(socket, reason);
  }, [disposeSocket]);

  // Add console entry
  const addConsoleEntry = useCallback((level: ConsoleEntry['level'], message: string, seq?: number) => {
    const entry: ConsoleEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      level,
      message,
      sequence: seq,
    };
    
    setConsoleEntries(prev => {
      const updated = [...prev, entry];
      // Keep only last 50 entries
      return updated.slice(-50);
    });
  }, []);

  // Generate mock telemetry data
  const generateMockTelemetry = useCallback((): TelemetryPayload => {
    sequenceRef.current += 1;
    const seq = sequenceRef.current;
    
    // Smooth oscillations for attitude
    const time = Date.now() / 1000;
    const roll_deg = Math.sin(time * 0.3) * 15 + Math.sin(time * 0.7) * 5;
    const pitch_deg = Math.sin(time * 0.2) * 8 + Math.sin(time * 0.5) * 3;
    
    // Heading drifts slowly
    const heading_deg = (117 + time * 2) % 360;
    
    // Altitude with vertical speed coupling
    const vertical_speed_mps = Math.sin(time * 0.4) * 2;
    const relative_m = 128 + Math.sin(time * 0.15) * 30;
    
    // Battery drains slowly from session start
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
    const elapsedSeconds = (Date.now() - startedAtRef.current) / 1000;
    const battery_pct = Math.max(20, 99 - elapsedSeconds * 0.005);
    
    // Signal fluctuates
    const signal_strength_pct = 70 + Math.sin(time * 0.8) * 15 + Math.random() * 5;
    
    // Temperature varies
    const temperature_c = 45 + Math.sin(time * 0.3) * 8 + Math.random() * 2;
    
    // IMU quality stays high with small variations
    const imu_quality_pct = 95 + Math.random() * 4;

    const telemetrySource = desiredModeRef.current === 'simulation' ? 'frontend-simulation' : 'frontend-mock';

    return {
      schema_version: '1.0.0',
      timestamp: new Date().toISOString(),
      sequence: seq,
      vehicle: {
        id: 'ATHENA-SIM-001',
        connection: {
          status: signal_strength_pct > 50 ? 'connected' : 'degraded',
          signal_strength_pct: Math.min(100, Math.max(0, signal_strength_pct)),
        },
        flight: {
          mode: seq % 600 < 400 ? 'CRUISE' : 'LOITER',
          system_status: 'nominal',
        },
      },
      attitude: {
        roll_deg,
        pitch_deg,
        heading_deg,
      },
      altitude: {
        relative_m,
        vertical_speed_mps,
      },
      power: {
        battery_pct,
      },
      health: {
        temperature_c,
        imu_quality_pct: Math.min(100, imu_quality_pct),
      },
      telemetry_source: telemetrySource,
      heading_is_estimated: false,
      altitude_is_relative: true,
      battery_available: true,
      calibration_status: 'ready',
      calibration_samples: 0,
      sensor_status: {
        imu_ok: true,
        baro_ok: true,
        serial_connected: true,
      },
    };
  }, []);

  // Start mock data generation
  const startMockData = useCallback((targetMode: DashboardMode) => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
    }
    
    setModeState(targetMode);
    setConnectionState('disconnected');
    addConsoleEntry('INFO', `${targetMode.toUpperCase()} telemetry mode activated`);
    
    mockIntervalRef.current = setInterval(() => {
      const data = generateMockTelemetry();
      setTelemetry(data);
      
      // Occasionally add console entries
      if (data.sequence % 20 === 0) {
        addConsoleEntry('INFO', `Attitude update (seq: ${data.sequence})`, data.sequence);
      }
      if (data.sequence % 50 === 0) {
        if (data.power.battery_pct !== null) {
          addConsoleEntry('INFO', `Battery ${data.power.battery_pct.toFixed(1)}%`);
        }
      }
    }, 100); // 10Hz update rate
  }, [generateMockTelemetry, addConsoleEntry]);

  // Stop mock data generation
  const stopMockData = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback((forceReconnect = false) => {
    const existingSocket = wsRef.current;
    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      if (!forceReconnect) {
        return;
      }
      closeActiveSocket('manual-reconnect');
    }

    stopMockData();
    desiredModeRef.current = 'live';
    setModeState('live');
    setConnectionState('connecting');
    addConsoleEntry('INFO', `Connecting to ${TELEMETRY_WS_URL}...`);

    try {
      const ws = new WebSocket(TELEMETRY_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) {
          return;
        }
        setConnectionState('connected');
        addConsoleEntry('INFO', 'WebSocket connected - Live telemetry active');
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) {
          return;
        }
        try {
          const parsed = parseTelemetryPayload(JSON.parse(event.data));
          if (!parsed) {
            addConsoleEntry('ERROR', 'Received invalid telemetry payload');
            return;
          }
          const data: TelemetryPayload = parsed;
          setTelemetry(data);
          
          // Add console entries for significant events
          if (data.sequence % 20 === 0) {
            addConsoleEntry('INFO', `Telemetry update (seq: ${data.sequence})`, data.sequence);
          }
        } catch (err) {
          console.error('Failed to parse telemetry:', err);
          addConsoleEntry('ERROR', 'Failed to parse telemetry data');
        }
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) {
          return;
        }
        setConnectionState('error');
        addConsoleEntry('ERROR', 'WebSocket error occurred');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        } else {
          // Ignore close events from stale sockets after reconnect.
          return;
        }
        if (teardownRef.current) {
          return;
        }
        setConnectionState('disconnected');
        addConsoleEntry('WARN', 'WebSocket disconnected');
        
        // Auto-fallback to mock mode
        if (desiredModeRef.current === 'live') {
          addConsoleEntry('INFO', 'Falling back to mock telemetry mode');
          desiredModeRef.current = 'mock';
          startMockData('mock');
        }
      };
    } catch {
      setConnectionState('error');
      addConsoleEntry('ERROR', 'Failed to create WebSocket connection');
      desiredModeRef.current = 'mock';
      startMockData('mock');
    }
  }, [stopMockData, startMockData, addConsoleEntry, closeActiveSocket]);

  // Set mode with proper handling
  const setMode = useCallback((newMode: DashboardMode) => {
    if (newMode === mode) return;
    
    desiredModeRef.current = newMode;
    setModeState(newMode);
    
    if (newMode === 'live') {
      connectWebSocket();
    } else {
      closeActiveSocket('switch-to-mock');
      startMockData(newMode);
    }
  }, [mode, connectWebSocket, startMockData, closeActiveSocket]);

  // Reconnect handler
  const reconnect = useCallback(() => {
    desiredModeRef.current = 'live';
    connectWebSocket(true);
  }, [connectWebSocket]);

  // Initialize on mount.
  //
  // Starting the telemetry stream necessarily sets mode/connection state synchronously,
  // which `react-hooks/set-state-in-effect` flags. The behaviour is intended: the
  // instruments must be live from first paint rather than after a second render pass.
  // Reworking this as a `useSyncExternalStore` subscription is tracked in the README
  // roadmap; the rule is suppressed here deliberately, not by accident.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    teardownRef.current = false;

    if (TELEMETRY_STARTUP_MODE === 'mock' || TELEMETRY_STARTUP_MODE === 'simulation') {
      desiredModeRef.current = TELEMETRY_STARTUP_MODE;
      startMockData(TELEMETRY_STARTUP_MODE);
    } else {
      // Keep instruments active while live connection initializes.
      startMockData('mock');
      const connectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 700);
      return () => {
        clearTimeout(connectTimeout);
        teardownRef.current = true;
        stopMockData();
        closeActiveSocket('unmount');
      };
    }
    
    return () => {
      teardownRef.current = true;
      stopMockData();
      closeActiveSocket('unmount');
    };
  }, [startMockData, stopMockData, connectWebSocket, closeActiveSocket]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    telemetry,
    connectionState,
    mode,
    consoleEntries,
    setMode,
    reconnect,
  };
}
