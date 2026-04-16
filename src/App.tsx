/**
 * Project Athena - Main Dashboard Application
 * 
 * Real-time UAV telemetry dashboard with:
 * - Central artificial horizon display
 * - Telemetry cards (roll, pitch, altitude, heading)
 * - System status panel
 * - Battery and signal indicators
 * - Health monitoring
 * - Console log
 */

import { motion } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Header } from '@/components/Header';
import { ArtificialHorizon } from '@/components/horizon/ArtificialHorizon';
import { TelemetryCard } from '@/components/cards/TelemetryCard';
import { BatteryCard } from '@/components/cards/BatteryCard';
import { SignalCard } from '@/components/cards/SignalCard';
import { SystemStatusCard } from '@/components/cards/SystemStatusCard';
import { HealthCard } from '@/components/cards/HealthCard';
import { ConsolePanel } from '@/components/panels/ConsolePanel';
import { TELEMETRY_WS_URL } from '@/config/telemetry';
import { 
  RotateCw, 
  MoveVertical, 
  ArrowUpFromLine, 
  Compass
} from 'lucide-react';

function App() {
  const { 
    telemetry, 
    connectionState, 
    mode, 
    consoleEntries, 
    setMode,
    reconnect 
  } = useTelemetry();

  // Get cardinal direction for heading
  const getCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const normalized = ((deg % 360) + 360) % 360;
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F4F6F8] font-sans overflow-hidden">
      {/* Background vignette */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <Header 
        mode={mode} 
        systemStatus={telemetry.vehicle.flight.system_status}
        onModeChange={setMode}
      />

      {/* Main Content */}
      <main className="relative p-4 lg:p-6">
        <div className="max-w-[1920px] mx-auto">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            
            {/* Left Column - System Status */}
            <motion.div 
              className="lg:col-span-3 space-y-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* System Status */}
              <SystemStatusCard 
                flight={telemetry.vehicle.flight}
                connection={telemetry.vehicle.connection}
              />

              {/* Battery */}
              <BatteryCard 
                percentage={telemetry.power.battery_pct}
                voltage={15.2 - (100 - telemetry.power.battery_pct) * 0.02}
              />

              {/* Signal */}
              <SignalCard 
                percentage={telemetry.vehicle.connection.signal_strength_pct}
                dbm={-50 - (100 - telemetry.vehicle.connection.signal_strength_pct) * 0.4}
              />

              {/* Connection Info */}
              <div className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#A9B3C1] uppercase tracking-wider">WebSocket</span>
                  <span className={`text-xs font-semibold ${
                    connectionState === 'connected' ? 'text-[#22C55E]' :
                    connectionState === 'connecting' ? 'text-[#F59E0B]' :
                    'text-[#EF4444]'
                  }`}>
                    {connectionState.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-[#A9B3C1] font-mono mb-3">
                  {TELEMETRY_WS_URL}
                </div>
                <button
                  onClick={reconnect}
                  disabled={connectionState === 'connecting'}
                  className="w-full px-3 py-2 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] text-sm font-medium
                    border border-[#22D3EE]/30 hover:bg-[#22D3EE]/20 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectionState === 'connecting' ? 'Connecting...' : 'Reconnect'}
                </button>
              </div>
            </motion.div>

            {/* Center Column - Artificial Horizon */}
            <motion.div 
              className="lg:col-span-6 flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <ArtificialHorizon attitude={telemetry.attitude} />
            </motion.div>

            {/* Right Column - Health & Console */}
            <motion.div 
              className="lg:col-span-3 space-y-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Health */}
              <HealthCard health={telemetry.health} />

              {/* Console */}
              <ConsolePanel entries={consoleEntries} />
            </motion.div>
          </div>

          {/* Bottom Row - Telemetry Cards */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Roll */}
            <TelemetryCard
              label="Roll"
              value={telemetry.attitude.roll_deg}
              unit="°"
              color="cyan"
              icon={<RotateCw className="w-4 h-4" />}
              miniIndicator="arc"
              minValue={-30}
              maxValue={30}
            />

            {/* Pitch */}
            <TelemetryCard
              label="Pitch"
              value={telemetry.attitude.pitch_deg}
              unit="°"
              color="green"
              icon={<MoveVertical className="w-4 h-4" />}
              miniIndicator="arc"
              minValue={-20}
              maxValue={20}
            />

            {/* Altitude */}
            <TelemetryCard
              label="Altitude"
              value={telemetry.altitude.relative_m}
              unit="m"
              subValue={`V/S ${telemetry.altitude.vertical_speed_mps >= 0 ? '+' : ''}${telemetry.altitude.vertical_speed_mps.toFixed(2)} m/s`}
              color="blue"
              icon={<ArrowUpFromLine className="w-4 h-4" />}
              miniIndicator="bar"
              minValue={0}
              maxValue={200}
            />

            {/* Heading */}
            <TelemetryCard
              label="Heading"
              value={telemetry.attitude.heading_deg}
              unit="°"
              subValue={getCardinal(telemetry.attitude.heading_deg)}
              color="amber"
              icon={<Compass className="w-4 h-4" />}
              miniIndicator="bar"
              minValue={0}
              maxValue={360}
            />
          </motion.div>

          {/* Footer - Sequence & Timestamp */}
          <motion.div 
            className="mt-6 flex items-center justify-between px-4 py-3 rounded-lg border border-[rgba(163,194,212,0.1)] bg-[#111827]/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A9B3C1]">Sequence:</span>
                <span className="text-sm font-mono text-[#22D3EE]">
                  #{telemetry.sequence.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A9B3C1]">Vehicle ID:</span>
                <span className="text-sm font-mono text-[#F4F6F8]">
                  {telemetry.vehicle.id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A9B3C1]">Last Update:</span>
              <span className="text-sm font-mono text-[#F4F6F8]">
                {new Date(telemetry.timestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default App;
