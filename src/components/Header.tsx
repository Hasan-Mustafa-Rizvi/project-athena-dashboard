/**
 * Project Athena - Header Component
 * 
 * Top navigation bar with title, mode indicator, and system status.
 */

import { motion } from 'framer-motion';
import { Satellite, Activity, Settings } from 'lucide-react';
import type { DashboardMode, VehicleFlight } from '@/types/telemetry';

interface HeaderProps {
  mode: DashboardMode;
  systemStatus: VehicleFlight['system_status'];
  onModeChange?: (mode: DashboardMode) => void;
}

const modeConfig: Record<DashboardMode, { label: string; color: string; dotColor: string }> = {
  live: { label: 'LIVE', color: '#22C55E', dotColor: '#22C55E' },
  simulation: { label: 'SIMULATION', color: '#F59E0B', dotColor: '#F59E0B' },
  mock: { label: 'MOCK', color: '#3B82F6', dotColor: '#3B82F6' },
};

const statusConfig: Record<VehicleFlight['system_status'], { label: string; color: string }> = {
  nominal: { label: 'SYS: NOMINAL', color: '#22C55E' },
  caution: { label: 'SYS: CAUTION', color: '#F59E0B' },
  warning: { label: 'SYS: WARNING', color: '#EF4444' },
};

export function Header({ mode, systemStatus, onModeChange }: HeaderProps) {
  const modeInfo = modeConfig[mode];
  const statusInfo = statusConfig[systemStatus];

  return (
    <motion.header
      className="flex items-center justify-between px-6 py-4 border-b border-[rgba(163,194,212,0.14)] bg-[#0B0F17]/80 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Satellite className="w-7 h-7 text-[#22D3EE]" />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0px rgba(34, 211, 238, 0)',
                  '0 0 15px rgba(34, 211, 238, 0.4)',
                  '0 0 0px rgba(34, 211, 238, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-[#F4F6F8] font-['Space_Grotesk']">
              PROJECT <span className="text-[#22D3EE]">ATHENA</span>
            </h1>
            <p className="text-xs text-[#A9B3C1] uppercase tracking-widest">
              UAV Telemetry Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Center: Mode Selector (optional) */}
      {onModeChange && (
        <div className="hidden md:flex items-center gap-2">
          {(['live', 'simulation', 'mock'] as DashboardMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider
                transition-all duration-200
                ${mode === m 
                  ? 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30' 
                  : 'bg-transparent text-[#A9B3C1] border border-transparent hover:border-[rgba(163,194,212,0.2)]'
                }
              `}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Right: Status Pills */}
      <div className="flex items-center gap-3">
        {/* Mode Indicator */}
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ 
            borderColor: `${modeInfo.color}40`,
            backgroundColor: `${modeInfo.color}10`,
          }}
          key={mode}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: modeInfo.dotColor }}
            animate={mode === 'live' ? {
              boxShadow: [
                `0 0 0px ${modeInfo.dotColor}`,
                `0 0 8px ${modeInfo.dotColor}`,
                `0 0 0px ${modeInfo.dotColor}`,
              ],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: modeInfo.color }}
          >
            {modeInfo.label}
          </span>
        </motion.div>

        {/* System Status */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ 
            borderColor: `${statusInfo.color}40`,
            backgroundColor: `${statusInfo.color}10`,
          }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: statusInfo.color }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Settings button */}
        <button className="p-2 rounded-lg text-[#A9B3C1] hover:text-[#F4F6F8] hover:bg-[rgba(163,194,212,0.1)] transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </motion.header>
  );
}
