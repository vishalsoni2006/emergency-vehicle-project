import React from 'react';
import { Sparkles, Siren, CheckCircle, Info } from 'lucide-react';
import { TRAFFIC_CONFIG } from '../config/trafficConfig';

export default function DemoControls({
  demoMode,
  setDemoMode,
  isEmergency,
  onSimulateAmbulance,
  onClearEmergency,
}) {
  if (!demoMode) return null;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 md:p-5 border-amber-500/30 bg-amber-950/10 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black font-display text-amber-300 uppercase tracking-wider">
                Demo Mode Active
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                TEST HARNESS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulates AI ambulance detections on any CCTV lane without requiring an active backend server.
            </p>
          </div>
        </div>

        {/* Clear / Deactivate */}
        {isEmergency && (
          <button
            onClick={onClearEmergency}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Resume Normal Cycle
          </button>
        )}
      </div>

      {/* 8 Quick Simulation Buttons */}
      <div className="mt-3">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-2">
          Trigger Instant Preemption Override:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((laneId) => {
            const laneInfo = TRAFFIC_CONFIG.LANES[laneId];
            return (
              <button
                key={laneId}
                onClick={() => onSimulateAmbulance(laneId, 0.946)}
                className="p-2 rounded-xl text-left border bg-slate-900/80 hover:bg-rose-950/40 hover:border-rose-500/50 active:scale-95 border-white/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-white group-hover:text-rose-300">
                    LANE {laneId}
                  </span>
                  <Siren className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                  {laneInfo.roadName} (Sig {laneInfo.signalId})
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
