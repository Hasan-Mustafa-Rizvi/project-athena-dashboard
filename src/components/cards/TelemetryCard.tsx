/**
 * Project Athena - Telemetry Card Component
 * 
 * Reusable card component for displaying telemetry values with
 * smooth animations and visual indicators.
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TelemetryCardProps {
  label: string;
  value: number;
  unit: string;
  subValue?: string;
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'blue';
  icon?: React.ReactNode;
  miniIndicator?: 'arc' | 'bar' | 'none';
  minValue?: number;
  maxValue?: number;
}

const colorMap = {
  cyan: 'text-[#22D3EE] border-[#22D3EE]/30 bg-[#22D3EE]/5',
  green: 'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/5',
  amber: 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5',
  red: 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5',
  blue: 'text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/5',
};

const glowMap = {
  cyan: 'shadow-[0_0_18px_rgba(34,211,238,0.15)]',
  green: 'shadow-[0_0_18px_rgba(34,197,94,0.15)]',
  amber: 'shadow-[0_0_18px_rgba(245,158,11,0.15)]',
  red: 'shadow-[0_0_18px_rgba(239,68,68,0.15)]',
  blue: 'shadow-[0_0_18px_rgba(59,130,246,0.15)]',
};

export function TelemetryCard({
  label,
  value,
  unit,
  subValue,
  color = 'cyan',
  icon,
  miniIndicator = 'none',
  minValue = -30,
  maxValue = 30,
}: TelemetryCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlashing, setIsFlashing] = useState(false);

  // Smooth value transition.
  //
  // The eased read-out is driven by a re-render cascade, which
  // `react-hooks/set-state-in-effect` flags. Migrating it to requestAnimationFrame is
  // tracked in the README roadmap; behaviour is intentionally left unchanged for now.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const diff = value - displayValue;
    if (Math.abs(diff) < 0.01) return;

    const step = diff * 0.3;
    const newValue = displayValue + step;
    setDisplayValue(newValue);
    
    // Flash effect on significant change
    if (Math.abs(diff) > 0.5) {
      setIsFlashing(true);
      const timeout = setTimeout(() => setIsFlashing(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const colorClass = colorMap[color];
  const glowClass = glowMap[color];

  // Calculate mini indicator position
  const indicatorPercent = Math.min(100, Math.max(0, 
    ((displayValue - minValue) / (maxValue - minValue)) * 100
  ));

  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border backdrop-blur-sm
        bg-[#111827]/60 border-[rgba(163,194,212,0.14)]
        transition-all duration-200
        hover:border-[rgba(163,194,212,0.28)] hover:-translate-y-0.5
        ${isFlashing ? glowClass : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Flash overlay */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${colorClass.split(' ')[2]}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isFlashing ? 0.3 : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#A9B3C1]">{icon}</span>}
          <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold font-['Space_Grotesk'] tracking-tight ${colorClass.split(' ')[0]}`}>
          {displayValue >= 0 ? '' : ''}{displayValue.toFixed(1)}
        </span>
        <span className="text-sm text-[#A9B3C1]">{unit}</span>
      </div>

      {/* Sub value */}
      {subValue && (
        <div className="mt-1 text-xs text-[#A9B3C1]">
          {subValue}
        </div>
      )}

      {/* Mini indicator */}
      {miniIndicator === 'arc' && (
        <div className="mt-3 relative h-8">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            {/* Background arc */}
            <path
              d="M 10 30 A 40 40 0 0 1 90 30"
              fill="none"
              stroke="rgba(163, 194, 212, 0.2)"
              strokeWidth="3"
            />
            {/* Value arc */}
            <motion.circle
              cx={10 + (indicatorPercent / 100) * 80}
              cy={30 - Math.sin((indicatorPercent / 100) * Math.PI) * 25}
              r="4"
              fill={color === 'cyan' ? '#22D3EE' : color === 'green' ? '#22C55E' : '#F59E0B'}
              transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
            />
          </svg>
        </div>
      )}

      {miniIndicator === 'bar' && (
        <div className="mt-3">
          <div className="h-1.5 bg-[rgba(163,194,212,0.15)] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                color === 'cyan' ? 'bg-[#22D3EE]' : 
                color === 'green' ? 'bg-[#22C55E]' : 
                color === 'amber' ? 'bg-[#F59E0B]' : 
                color === 'red' ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'
              }`}
              style={{ width: `${indicatorPercent}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
