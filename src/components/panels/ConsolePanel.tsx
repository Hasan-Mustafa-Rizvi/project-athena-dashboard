/**
 * Project Athena - Console Panel Component
 * 
 * Displays real-time console log entries with auto-scroll.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { Terminal, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ConsoleEntry } from '@/types/telemetry';

interface ConsolePanelProps {
  entries: ConsoleEntry[];
}

const levelIcons = {
  INFO: <Info className="w-3.5 h-3.5 text-[#3B82F6]" />,
  WARN: <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />,
  ERROR: <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />,
};

const levelColors = {
  INFO: 'text-[#3B82F6]',
  WARN: 'text-[#F59E0B]',
  ERROR: 'text-[#EF4444]',
};

export function ConsolePanel({ entries }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <motion.div
      className="p-4 rounded-xl border border-[rgba(163,194,212,0.14)] bg-[#111827]/60 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#A9B3C1]" />
          <span className="text-xs font-medium text-[#A9B3C1] uppercase tracking-wider">
            Console
          </span>
        </div>
        <span className="text-xs text-[#A9B3C1]/60">
          {entries.length} entries
        </span>
      </div>

      {/* Log entries */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-[220px] min-h-[180px] space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-[rgba(163,194,212,0.2)] scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-[#0B0F17]/50 border border-[rgba(163,194,212,0.08)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {levelIcons[entry.level]}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#A9B3C1]/60 font-mono">[{entry.timestamp}]</span>
                  <span className={`font-semibold ${levelColors[entry.level]}`}>
                    {entry.level}
                  </span>
                </div>
                <p className="text-sm text-[#F4F6F8] mt-0.5 truncate">
                  {entry.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {entries.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#A9B3C1]/40 text-sm">
            No messages yet...
          </div>
        )}
      </div>
    </motion.div>
  );
}
