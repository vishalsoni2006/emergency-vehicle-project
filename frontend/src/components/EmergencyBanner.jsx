import React from 'react';
import { Siren, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

export default function EmergencyBanner({
  emergencyData,
  onClearEmergency,
}) {
  if (!emergencyData || !emergencyData.active) return null;

  const { laneId, laneName, roadId, roadName, signalId, confidence } = emergencyData;
  const confFormatted = (confidence * 100).toFixed(1);

  return (
    <div className="w-full glass-panel rounded-2xl border-2 border-rose-500 bg-rose-950/40 p-4 md:p-5 shadow-[0_0_35px_rgba(244,63,94,0.5)] animate-pulse-fast my-4 relative overflow-hidden">
      {/* Background glow streak */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-600/10 via-rose-500/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Alert Icon & Main Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 border border-rose-400 flex items-center justify-center text-white shadow-[0_0_20px_#f43f5e] shrink-0 animate-bounce">
            <Siren className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white tracking-widest">
                CRITICAL OVERRIDE
              </span>
              <span className="text-xs font-mono text-rose-300 font-bold">
                SIGNAL CONTROLLER INTERCEPT
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-black font-display text-white tracking-tight uppercase mt-0.5">
              🚨 AMBULANCE DETECTED — EMERGENCY PRIORITY ACTIVATED
            </h2>
          </div>
        </div>

        {/* Center: Key Detection Parameters */}
        <div className="flex flex-wrap items-center gap-2.5 md:gap-4 bg-black/60 px-4 py-2.5 rounded-xl border border-rose-500/30">
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Confidence</div>
            <div className="text-sm font-mono font-black text-rose-400">{confFormatted}%</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Target Lane</div>
            <div className="text-sm font-mono font-bold text-white">Lane {laneId}</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Target Road</div>
            <div className="text-sm font-mono font-bold text-white">{roadName}</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Traffic Signal</div>
            <div className="text-sm font-mono font-bold text-emerald-400">Signal {signalId} (GREEN)</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</div>
            <div className="text-xs font-mono font-bold text-rose-400 uppercase">PRIORITY GREEN</div>
          </div>
        </div>

        {/* Right: Manual Deactivation Button */}
        <button
          onClick={onClearEmergency}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center gap-1.5 transition-all shrink-0"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Clear / Return to Normal
        </button>
      </div>
    </div>
  );
}
