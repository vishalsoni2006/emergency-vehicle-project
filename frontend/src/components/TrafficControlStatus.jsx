import React from 'react';
import { Sliders, Siren, ShieldCheck } from 'lucide-react';

export default function TrafficControlStatus({
  signals,
  mode,
  emergencyData,
}) {
  const isEmergency = mode === 'EMERGENCY';

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col h-full border-white/10">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
            Traffic Control Status
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          GRID TELEMETRY
        </span>
      </div>

      {/* 4 Signals Telemetry */}
      <div className="space-y-2.5 mb-4">
        {[1, 2, 3, 4].map((id) => {
          const sig = signals[id];
          const isGreen = sig.state === 'GREEN';
          const isYellow = sig.state === 'YELLOW';
          const isRed = sig.state === 'RED';

          return (
            <div
              key={id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isGreen
                  ? 'bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                  : isYellow
                    ? 'bg-amber-950/25 border-amber-500/40'
                    : 'bg-slate-900/60 border-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isGreen
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : isYellow
                      ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                      : 'bg-rose-500/80 shadow-[0_0_6px_#f43f5e]'
                }`} />
                <span className="text-xs font-mono font-bold text-white">
                  Signal {id} (Road {id})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  isGreen
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isYellow
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/15 text-rose-300'
                }`}>
                  {sig.state}
                </span>
                <span className="text-xs font-mono text-slate-400 w-8 text-right">
                  {sig.timer > 0 ? `${sig.timer}s` : '--'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Meta Indicators */}
      <div className="pt-3 border-t border-white/10 space-y-2 mt-auto">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Emergency Override:</span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
            isEmergency 
              ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_8px_#f43f5e]' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isEmergency ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Priority Lane:</span>
          <span className="font-mono font-bold text-white">
            {isEmergency ? `Lane ${emergencyData?.laneId}` : 'None (Normal Cycle)'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Priority Road:</span>
          <span className="font-mono font-bold text-white">
            {isEmergency ? `${emergencyData?.roadName}` : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
