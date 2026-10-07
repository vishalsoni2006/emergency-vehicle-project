import React from 'react';

/**
 * Realistic Physical Traffic Light Component
 * 
 * Features:
 * - 3 circular lamps: Red, Yellow, Green
 * - Glowing lens shaders for the active light
 * - Visor/hood shadow styling for physical realism
 * - Digital countdown readout
 */
export default function TrafficSignal({
  signalId,
  roadName = `Road ${signalId}`,
  state = 'RED', // 'RED' | 'YELLOW' | 'GREEN'
  timer = 0,
  isPriority = false,
  compact = false,
}) {
  const isRed = state === 'RED';
  const isYellow = state === 'YELLOW';
  const isGreen = state === 'GREEN';

  if (compact) {
    return (
      <div className={`flex flex-col items-center bg-slate-950/95 border ${
        isPriority ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-slate-800'
      } rounded-xl p-1.5 shadow-2xl backdrop-blur-md`}>
        <div className="text-[9px] font-mono font-bold text-slate-400 mb-1">
          SIG {signalId}
        </div>
        
        {/* Compact 3-light bezel */}
        <div className="flex flex-col gap-1.5 p-1 bg-black/80 rounded-lg border border-white/5">
          {/* Red Lamp */}
          <div className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
            isRed 
              ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e] ring-1 ring-white/50' 
              : 'bg-rose-950/40 opacity-20'
          }`} />
          {/* Yellow Lamp */}
          <div className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
            isYellow 
              ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24] ring-1 ring-white/50' 
              : 'bg-amber-950/40 opacity-20'
          }`} />
          {/* Green Lamp */}
          <div className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
            isGreen 
              ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] ring-1 ring-white/50' 
              : 'bg-emerald-950/40 opacity-20'
          }`} />
        </div>

        {/* Compact Timer */}
        <div className="mt-1 text-[10px] font-mono font-bold text-slate-200">
          {timer > 0 ? `${timer}s` : '--'}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-3.5 rounded-2xl flex flex-col items-center transition-all duration-300 ${
      isPriority 
        ? 'border-rose-500/80 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.4)]' 
        : 'border-white/10 hover:border-white/20'
    }`}>
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="text-xs font-bold text-white tracking-wide">
          SIGNAL {signalId}
        </span>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isPriority 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
            : isGreen 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : isYellow 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400'
        }`}>
          {state}
        </span>
      </div>

      {/* Traffic Light Housing */}
      <div className="relative bg-gradient-to-b from-slate-950 to-black p-3 rounded-2xl border-2 border-slate-700/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] flex flex-col gap-2.5 items-center">
        {/* Red Lamp with visor hood */}
        <div className="relative group">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-800 rounded-t-full opacity-60"></div>
          <div 
            className={`w-7 h-7 rounded-full light-lens ${
              isRed ? 'light-red-active' : 'bg-red-950/30 border border-red-900/30'
            }`} 
          />
        </div>

        {/* Yellow Lamp with visor hood */}
        <div className="relative group">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-800 rounded-t-full opacity-60"></div>
          <div 
            className={`w-7 h-7 rounded-full light-lens ${
              isYellow ? 'light-yellow-active' : 'bg-yellow-950/30 border border-yellow-900/30'
            }`} 
          />
        </div>

        {/* Green Lamp with visor hood */}
        <div className="relative group">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-800 rounded-t-full opacity-60"></div>
          <div 
            className={`w-7 h-7 rounded-full light-lens ${
              isGreen ? 'light-green-active' : 'bg-emerald-950/30 border border-emerald-900/30'
            }`} 
          />
        </div>
      </div>

      {/* Countdown Digital Timer */}
      <div className="mt-3 text-center">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Phase Timer
        </div>
        <div className={`text-xl font-black font-mono tracking-tight mt-0.5 ${
          isPriority 
            ? 'text-rose-400 animate-pulse' 
            : isGreen 
              ? 'text-emerald-400' 
              : isYellow 
                ? 'text-amber-400' 
                : 'text-slate-500'
        }`}>
          {isPriority && isGreen ? 'PRIORITY' : timer > 0 ? `${timer}s` : '--'}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {roadName}
        </div>
      </div>
    </div>
  );
}
