import React from 'react';
import { Activity, ShieldAlert, Video, Radio, RotateCcw, Sparkles } from 'lucide-react';

export default function Header({
  mode,
  analytics,
  demoMode,
  setDemoMode,
  onReset,
}) {
  const isEmergency = mode === 'EMERGENCY';

  return (
    <header className="w-full glass-panel border-b border-command-border px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title & Branding */}
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white uppercase flex items-center gap-2">
              AI Emergency Traffic Management System
            </h1>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-400 mt-0.5 tracking-wide">
            Intelligent Ambulance Priority Control • Autonomous CCTV Junction Preemption
          </p>
        </div>

        {/* System Status Indicators Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* System Status */}
          <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Status</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
              ONLINE
            </div>
          </div>

          {/* AI Detection */}
          <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Detection</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              READY
            </div>
          </div>

          {/* Emergency Mode */}
          <div className={`glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all duration-300 ${
            isEmergency 
              ? 'border-rose-500/80 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
              : 'border-white/10'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Emergency Mode</div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              isEmergency ? 'text-rose-400 animate-pulse' : 'text-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isEmergency 
                  ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' 
                  : 'bg-emerald-400'
              }`}></span>
              {isEmergency ? 'ACTIVE' : 'NORMAL'}
            </div>
          </div>

          {/* Videos Processed */}
          <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Videos Processed</div>
            <div className="text-xs font-mono font-bold text-white">
              {analytics.totalVideosProcessed}
            </div>
          </div>

          {/* Ambulances Detected */}
          <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ambulances</div>
            <div className="text-xs font-mono font-bold text-amber-400">
              {analytics.ambulanceDetections}
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              demoMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle interactive demonstration triggers without requiring active backend"
          >
            <Sparkles className="w-3.5 h-3.5" />
            DEMO MODE: {demoMode ? 'ON' : 'OFF'}
          </button>

          {/* Reset Simulation */}
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white transition-all active:scale-95"
            title="Reset simulation and restart normal cyclic rotation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
        </div>
      </div>
    </header>
  );
}
