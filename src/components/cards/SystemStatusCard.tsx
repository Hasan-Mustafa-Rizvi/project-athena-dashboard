/**
 * Project Athena - System Status Card Component
 * 
 * Displays flight mode, system status, and connection state.
 */

import { motion } from 'framer-motion';
import { Plane, Activity, Plug } from 'lucide-react';
import type { VehicleFlight, VehicleConnection } from '@/types/telemetry';

interface SystemStatusCardProps {
  flight: VehicleFlight;
  connection: VehicleConnection;
}

const modeColors: Record<VehicleFlight['mode'], string> = {
  STABILIZE: '#A9B3C1',
  AUTO_LEVEL: '#3B82F6',
  CRUISE: '#22C55E',
  LOITER: '#F59E0B',
  RTL: '#F59E0B',
};

const statusColors: Record<VehicleFlight['system_status'], string> = {
  nominal: '#22C55E',
  caution: '#F59E0B',
  warning: '#EF4444',
};

const connectionColors: Record<VehicleConnection['status'], string> = {
  connected: '#22C55E',
  degraded: '#F59E0B',
  disconnected: '#EF4444',
};

export function SystemStatusCard({ flight, connection }: SystemStatusCardProps) {
  return (
    <motion.div
      className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#A9B3C1]" />
        <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
          System Status
        </span>
      </div>

      {/* Status items */}
      <div className="space-y-3">
        {/* Flight Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#A9B3C1]" />
            <span className="text-sm text-[#A9B3C1]">Flight Mode</span>
          </div>
          <motion.span
            className="px-2.5 py-1 rounded-md text-sm font-semibold font-['Space_Grotesk']"
            style={{ 
              color: modeColors[flight.mode],
              backgroundColor: `${modeColors[flight.mode]}15`,
            }}
            key={flight.mode}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {flight.mode}
          </motion.span>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#A9B3C1]" />
            <span className="text-sm text-[#A9B3C1]">System</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColors[flight.system_status] }}
              animate={{
                boxShadow: [
                  `0 0 0px ${statusColors[flight.system_status]}`,
                  `0 0 8px ${statusColors[flight.system_status]}`,
                  `0 0 0px ${statusColors[flight.system_status]}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span 
              className="text-sm font-semibold font-['Space_Grotesk'] uppercase"
              style={{ color: statusColors[flight.system_status] }}
            >
              {flight.system_status}
            </span>
          </div>
        </div>

        {/* Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-[#A9B3C1]" />
            <span className="text-sm text-[#A9B3C1]">Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: connectionColors[connection.status] }}
              animate={connection.status === 'degraded' ? {
                opacity: [1, 0.3, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span 
              className="text-sm font-semibold font-['Space_Grotesk'] uppercase"
              style={{ color: connectionColors[connection.status] }}
            >
              {connection.status}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
