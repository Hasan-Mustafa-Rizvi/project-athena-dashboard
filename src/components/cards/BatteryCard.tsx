/**
 * Project Athena - Battery Card Component
 * 
 * Displays battery percentage with segmented bar and voltage.
 */

import { motion } from 'framer-motion';
import { Battery, Zap } from 'lucide-react';

interface BatteryCardProps {
  percentage: number;
  voltage?: number;
}

export function BatteryCard({ percentage, voltage = 15.2 }: BatteryCardProps) {
  // Determine color based on percentage
  const getColor = (pct: number): string => {
    if (pct > 50) return '#22C55E';
    if (pct > 25) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(percentage);
  const segments = 10;
  const filledSegments = Math.ceil((percentage / 100) * segments);

  return (
    <motion.div
      className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4 text-[#A9B3C1]" />
          <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
            Battery
          </span>
        </div>
        <Zap className="w-4 h-4" style={{ color }} />
      </div>

      {/* Main percentage */}
      <div className="flex items-baseline gap-1 mb-2">
        <motion.span 
          className="text-4xl font-bold font-['Space_Grotesk']"
          style={{ color }}
          key={Math.round(percentage)}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {percentage.toFixed(0)}
        </motion.span>
        <span className="text-lg" style={{ color }}>%</span>
      </div>

      {/* Voltage */}
      <div className="text-xs text-[#A9B3C1] mb-3">
        {voltage.toFixed(1)} V
      </div>

      {/* Segmented bar */}
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <motion.div
            key={i}
            className="flex-1 h-2 rounded-sm"
            style={{
              backgroundColor: i < filledSegments ? color : 'rgba(163, 194, 212, 0.15)',
            }}
            initial={false}
            animate={{
              backgroundColor: i < filledSegments ? color : 'rgba(163, 194, 212, 0.15)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="mt-2 text-xs">
        {percentage > 50 && <span className="text-[#22C55E]">Good</span>}
        {percentage > 25 && percentage <= 50 && <span className="text-[#F59E0B]">Moderate</span>}
        {percentage <= 25 && <span className="text-[#EF4444]">Low Battery</span>}
      </div>
    </motion.div>
  );
}
