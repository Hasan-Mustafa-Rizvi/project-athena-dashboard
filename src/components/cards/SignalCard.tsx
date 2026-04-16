/**
 * Project Athena - Signal Card Component
 * 
 * Displays signal strength percentage with continuous bar and dBm.
 */

import { motion } from 'framer-motion';
import { Wifi, Radio } from 'lucide-react';

interface SignalCardProps {
  percentage: number;
  dbm?: number;
}

export function SignalCard({ percentage, dbm = -62 }: SignalCardProps) {
  // Determine color based on percentage
  const getColor = (pct: number): string => {
    if (pct > 70) return '#22C55E';
    if (pct > 40) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(percentage);

  return (
    <motion.div
      className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#A9B3C1]" />
          <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
            Signal
          </span>
        </div>
        <Wifi className="w-4 h-4" style={{ color }} />
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

      {/* dBm */}
      <div className="text-xs text-[#A9B3C1] mb-3">
        {dbm} dBm
      </div>

      {/* Continuous bar */}
      <div className="h-2 bg-[rgba(163,194,212,0.15)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ 
            backgroundColor: color,
            width: `${percentage}%`,
          }}
          initial={false}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Status text */}
      <div className="mt-2 text-xs">
        {percentage > 70 && <span className="text-[#22C55E]">Strong</span>}
        {percentage > 40 && percentage <= 70 && <span className="text-[#F59E0B]">Fair</span>}
        {percentage <= 40 && <span className="text-[#EF4444]">Weak</span>}
      </div>
    </motion.div>
  );
}
