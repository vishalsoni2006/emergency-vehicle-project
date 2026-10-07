import React from 'react';
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Siren } from 'lucide-react';

export default function Lane({
  laneId,
  roadId,
  name,
  orientation = 'vertical', // 'vertical' | 'horizontal'
  direction = 'inbound',    // 'inbound' | 'outbound'
  isEmergencyActive = false,
  isGreen = false,
}) {
  return (
    <div
      className={`relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
        isEmergencyActive
          ? 'emergency-pulse-border bg-rose-950/50 z-20'
          : isGreen
            ? 'bg-emerald-950/20 border border-emerald-500/30'
            : 'bg-slate-900/40 border border-white/5'
      }`}
    >
      {/* Emergency Beacon Tag */}
      {isEmergencyActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_12px_#f43f5e] flex items-center gap-1 z-30 animate-bounce">
          <Siren className="w-2.5 h-2.5" />
          AMBULANCE
        </div>
      )}

      {/* Lane Identifier */}
      <div className="flex flex-col items-center">
        <span className={`text-[10px] font-mono font-bold ${
          isEmergencyActive ? 'text-rose-300' : isGreen ? 'text-emerald-300' : 'text-slate-400'
        }`}>
          LANE {laneId}
        </span>
      </div>
    </div>
  );
}
