/**
 * Project Athena - Artificial Horizon Component
 * 
 * Central attitude indicator displaying roll, pitch, and heading.
 * Features smooth animated horizon, pitch ladder, and aircraft reference symbol.
 */

import { motion } from 'framer-motion';
import type { Attitude } from '@/types/telemetry';

interface ArtificialHorizonProps {
  attitude: Attitude;
}

// Pitch ladder lines (degrees)
const PITCH_LINES = [-30, -20, -15, -10, -5, 5, 10, 15, 20, 30];

export function ArtificialHorizon({ attitude }: ArtificialHorizonProps) {
  const { roll_deg, pitch_deg, heading_deg } = attitude;
  
  // Map pitch to pixels (±30° = ±180px)
  const pitchOffset = -pitch_deg * 6;
  
  // Format heading to 0-360
  const normalizedHeading = ((heading_deg % 360) + 360) % 360;
  
  // Get cardinal direction
  const getCardinal = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Heading Tape */}
      <div className="relative w-full max-w-[500px] h-10 mb-2 overflow-hidden rounded-lg bg-[#111827]/80 border border-[rgba(163,194,212,0.14)]">
        {/* Heading scale */}
        <motion.div 
          className="absolute inset-0 flex items-center"
          style={{
            x: -(normalizedHeading * 3) + 250, // Center the current heading
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
        >
          {Array.from({ length: 121 }, (_, i) => {
            const deg = i * 3;
            const isMajor = deg % 15 === 0;
            const isCardinal = deg % 45 === 0;
            
            return (
              <div
                key={deg}
                className="absolute flex flex-col items-center"
                style={{ left: deg * 3 }}
              >
                <div 
                  className={`w-[1px] ${isMajor ? 'h-3 bg-[#A9B3C1]' : 'h-1.5 bg-[#A9B3C1]/50'}`} 
                />
                {isMajor && (
                  <span className={`text-[10px] mt-0.5 ${isCardinal ? 'text-[#22D3EE] font-semibold' : 'text-[#A9B3C1]'}`}>
                    {isCardinal ? getCardinal(deg) : (deg % 360).toString().padStart(3, '0')}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>
        
        {/* Heading pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#22D3EE]" />
        </div>
        
        {/* Current heading display */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#0B0F17] rounded border border-[rgba(163,194,212,0.2)]">
          <span className="text-xs font-mono text-[#22D3EE]">
            {normalizedHeading.toFixed(0).padStart(3, '0')}°
          </span>
        </div>
      </div>

      {/* Main Horizon Circle */}
      <div className="relative w-[min(58vh,62vw)] max-w-[760px] aspect-square">
        {/* Outer ring with roll indicator */}
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(163,194,212,0.2)] bg-[#0B0F17]/50">
          {/* Roll scale */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Roll tick marks */}
            {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((angle) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const x1 = 50 + 42 * Math.cos(rad);
              const y1 = 50 + 42 * Math.sin(rad);
              const x2 = 50 + 46 * Math.cos(rad);
              const y2 = 50 + 46 * Math.sin(rad);
              const isZero = angle === 0;
              
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isZero ? '#22D3EE' : '#A9B3C1'}
                  strokeWidth={isZero ? 0.8 : 0.4}
                />
              );
            })}
            
            {/* Roll pointer (triangle at top) */}
            <polygon
              points="50,6 47,11 53,11"
              fill="#22D3EE"
            />
          </svg>
        </div>

        {/* Horizon viewport (clipped circle) */}
        <div className="absolute inset-[8%] rounded-full overflow-hidden bg-[#0B0F17]">
          {/* Rotating horizon container */}
          <motion.div
            className="absolute inset-0"
            style={{
              rotate: -roll_deg,
            }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
          >
            {/* Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6] to-[#1E40AF]" 
              style={{ height: '50%', top: 0 }} 
            />
            
            {/* Ground */}
            <div 
              className="absolute bg-gradient-to-b from-[#92400E] to-[#78350F]"
              style={{ 
                height: '50%', 
                top: '50%',
                width: '100%',
              }} 
            />
            
            {/* Horizon line */}
            <div className="absolute left-0 right-0 h-[2px] bg-[#F4F6F8] top-1/2 -translate-y-1/2" />
            
            {/* Pitch ladder */}
            <motion.div
              className="absolute inset-0"
              style={{
                y: pitchOffset,
              }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
            >
              {PITCH_LINES.map((pitch) => {
                const yPos = 50 - (pitch / 60) * 50; // Map -30 to +30 degrees to vertical position
                const isMajor = Math.abs(pitch) >= 20;
                const lineWidth = isMajor ? '40%' : '25%';
                
                return (
                  <div key={pitch}>
                    {/* Upper lines (negative pitch) */}
                    {pitch < 0 && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                        style={{ top: `${yPos}%` }}
                      >
                        <div 
                          className="h-[1px] bg-[#F4F6F8]/70"
                          style={{ width: lineWidth }}
                        />
                        <span className="absolute text-[10px] text-[#F4F6F8]/80 font-mono mx-2">
                          {Math.abs(pitch)}
                        </span>
                      </div>
                    )}
                    {/* Lower lines (positive pitch) */}
                    {pitch > 0 && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                        style={{ top: `${yPos}%` }}
                      >
                        <div 
                          className="h-[1px] bg-[#F4F6F8]/70"
                          style={{ width: lineWidth }}
                        />
                        <span className="absolute text-[10px] text-[#F4F6F8]/80 font-mono mx-2">
                          {pitch}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* Aircraft reference symbol (fixed, not rotating) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="120" height="60" viewBox="0 0 120 60" className="overflow-visible">
            {/* Left wing */}
            <line x1="0" y1="30" x2="45" y2="30" stroke="#FACC15" strokeWidth="2.5" />
            {/* Right wing */}
            <line x1="75" y1="30" x2="120" y2="30" stroke="#FACC15" strokeWidth="2.5" />
            {/* Center dot */}
            <circle cx="60" cy="30" r="4" fill="#FACC15" />
            {/* Vertical line */}
            <line x1="60" y1="26" x2="60" y2="14" stroke="#FACC15" strokeWidth="2" />
            {/* Top chevron */}
            <polyline 
              points="52,18 60,10 68,18" 
              fill="none" 
              stroke="#FACC15" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Bank angle indicator (moves with roll) */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            rotate: -roll_deg,
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
        >
          <div className="absolute top-[6%] left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#EF4444]" />
          </div>
        </motion.div>
      </div>

      {/* Roll value display */}
      <div className="mt-3 flex items-center gap-4">
        <div className="px-3 py-1.5 bg-[#111827] rounded-lg border border-[rgba(163,194,212,0.14)]">
          <span className="text-xs text-[#A9B3C1] uppercase tracking-wider">Roll</span>
          <span className="ml-2 text-sm font-mono text-[#F4F6F8]">{roll_deg.toFixed(1)}°</span>
        </div>
        <div className="px-3 py-1.5 bg-[#111827] rounded-lg border border-[rgba(163,194,212,0.14)]">
          <span className="text-xs text-[#A9B3C1] uppercase tracking-wider">Pitch</span>
          <span className="ml-2 text-sm font-mono text-[#F4F6F8]">{pitch_deg.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
}
