/**
 * Project Athena - Health Card Component
 * 
 * Displays temperature and IMU quality metrics.
 */

import { motion } from 'framer-motion';
import { Thermometer, Cpu } from 'lucide-react';
import type { Health } from '@/types/telemetry';

interface HealthCardProps {
  health: Health;
}

export function HealthCard({ health }: HealthCardProps) {
  const { temperature_c, imu_quality_pct } = health;

  // Temperature color
  const getTempColor = (temp: number): string => {
    if (temp < 50) return '#22C55E';
    if (temp < 70) return '#F59E0B';
    return '#EF4444';
  };

  // IMU quality color
  const getImuColor = (quality: number): string => {
    if (quality > 90) return '#22C55E';
    if (quality > 70) return '#F59E0B';
    return '#EF4444';
  };

  const tempColor = getTempColor(temperature_c);
  const imuColor = getImuColor(imu_quality_pct);

  return (
    <motion.div
      className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-[#A9B3C1]" />
        <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
          Health
        </span>
      </div>

      {/* Temperature */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#A9B3C1]" />
            <span className="text-sm text-[#A9B3C1]">Temperature</span>
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-xl font-bold font-['Space_Grotesk']"
              style={{ color: tempColor }}
              key={Math.round(temperature_c)}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {temperature_c.toFixed(1)}
            </motion.span>
            <span className="text-sm" style={{ color: tempColor }}>°C</span>
          </div>
        </div>
        <div className="h-1.5 bg-[rgba(163,194,212,0.15)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: tempColor,
              width: `${Math.min(100, (temperature_c / 80) * 100)}%`,
            }}
            initial={false}
            animate={{
              width: `${Math.min(100, (temperature_c / 80) * 100)}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* IMU Quality */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#A9B3C1]" />
            <span className="text-sm text-[#A9B3C1]">IMU Quality</span>
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span
              className="text-xl font-bold font-['Space_Grotesk']"
              style={{ color: imuColor }}
              key={Math.round(imu_quality_pct)}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {imu_quality_pct.toFixed(0)}
            </motion.span>
            <span className="text-sm" style={{ color: imuColor }}>%</span>
          </div>
        </div>
        <div className="h-1.5 bg-[rgba(163,194,212,0.15)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: imuColor,
              width: `${imu_quality_pct}%`,
            }}
            initial={false}
            animate={{
              width: `${imu_quality_pct}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
