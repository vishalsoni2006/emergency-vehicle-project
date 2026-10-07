import React from 'react';
import { 
  BarChart3, 
  Film, 
  Layers, 
  Siren, 
  Clock, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import ConfusionMatrix from './ConfusionMatrix';
import ModelMetrics from './ModelMetrics';

export default function AnalyticsDashboard({
  analytics,
  lastEmergencySummary = null,
  backendMetrics = null,
  confusionMatrix = null,
}) {
  const {
    totalVideosProcessed,
    totalFrames,
    ambulanceDetections,
    confidenceList,
    emergencyEventsCount,
    totalEmergencyDurationSec,
    fps,
    processingTimeSec,
  } = analytics;

  // Compute confidence stats
  const avgConf = confidenceList.length > 0
    ? ((confidenceList.reduce((a, b) => a + b, 0) / confidenceList.length) * 100).toFixed(1)
    : '0.0';

  const maxConf = confidenceList.length > 0
    ? (Math.max(...confidenceList) * 100).toFixed(1)
    : '0.0';

  const durationFormatted = totalEmergencyDurationSec.toFixed(1);
  const procTimeFormatted = processingTimeSec.toFixed(1);

  return (
    <div className="w-full space-y-6 my-8">
      {/* Section Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight uppercase flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Video Analysis Results & Junction Telemetry
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Comprehensive quantitative analysis from processed CCTV lane videos
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
          SESSION REPORT
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Videos Processed */}
        <div className="glass-panel p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Videos Processed</span>
            <Film className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalVideosProcessed}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">CCTV Streams Evaluated</div>
        </div>

        {/* Total Frames */}
        <div className="glass-panel p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Total Frames</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {totalFrames.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Decoded Video Frames</div>
        </div>

        {/* Ambulance Detections */}
        <div className="glass-panel p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Ambulance Detections</span>
            <Siren className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {ambulanceDetections}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Emergency Vehicles Verified</div>
        </div>

        {/* Average Confidence */}
        <div className="glass-panel p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Average Confidence</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {avgConf}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Mean AI Detection Score</div>
        </div>

        {/* Maximum Confidence */}
        <div className="glass-panel p-4 rounded-2xl border-white/10">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Maximum Confidence</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {maxConf}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Peak Confidence Frame</div>
        </div>
      </div>

      {/* Secondary Detailed Statistics & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Video Analysis Statistics */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Video Analysis Statistics
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SYSTEM PERFORMANCE</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Frames Processed:</span>
              <span className="font-bold text-white">{totalFrames} frames</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Processing FPS:</span>
              <span className="font-bold text-cyan-400">{fps} FPS</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Processing Time:</span>
              <span className="font-bold text-white">{procTimeFormatted} seconds</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Total Ambulance Detections:</span>
              <span className="font-bold text-rose-400">{ambulanceDetections}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Emergency Mode Activations:</span>
              <span className="font-bold text-rose-400">{emergencyEventsCount} events</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
              <span className="text-slate-400">Total Emergency Duration:</span>
              <span className="font-bold text-amber-400">{durationFormatted} seconds</span>
            </div>
          </div>
        </div>

        {/* Right: Confidence Over Time Visualization */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Confidence & Preemption Activity
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SESSION TELEMETRY</span>
          </div>

          <div className="relative h-44 w-full flex items-end gap-1.5 pt-4 pb-2 px-2 bg-slate-950/80 rounded-xl border border-white/5">
            {confidenceList.length > 0 ? (
              confidenceList.map((val, idx) => {
                const heightPercent = Math.max(15, Math.min(100, Math.round(val * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-rose-600 via-rose-500 to-cyan-400 group-hover:brightness-125 transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-black text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/20 pointer-events-none transition-all z-20">
                      {(val * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-slate-500 font-mono self-center">
                Confidence timeline will graph here after video uploads.
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span>Video Segment Start</span>
            <span>Confidence Curve</span>
            <span>Video Segment End</span>
          </div>
        </div>
      </div>

      {/* Model Performance & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConfusionMatrix matrixData={confusionMatrix} />
        <ModelMetrics metrics={backendMetrics} />
      </div>

      {/* FINAL EMERGENCY SUMMARY */}
      <div className="glass-panel p-5 rounded-2xl border-white/10 bg-slate-900/40">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black font-display text-white uppercase tracking-wider">
              Emergency Event Summary
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">POST-INCIDENT AUDIT</span>
        </div>

        {emergencyEventsCount > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-slate-400 text-[10px] block">Ambulance Detected:</span>
              <span className="font-bold text-rose-400 text-sm">YES (CONFIRMED)</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-slate-400 text-[10px] block">Priority Corridor:</span>
              <span className="font-bold text-white text-sm">
                Lane {lastEmergencySummary?.laneId || 5} ({lastEmergencySummary?.roadName || 'Road 3'})
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-slate-400 text-[10px] block">Activated Signal:</span>
              <span className="font-bold text-emerald-400 text-sm">
                Signal {lastEmergencySummary?.signalId || 3} (PRIORITY GREEN)
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <span className="text-slate-400 text-[10px] block">Normal Cycle Restored:</span>
              <span className="font-bold text-cyan-400 text-sm">YES (AUTOMATED)</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-mono font-bold text-white">
                AMBULANCE DETECTED: NO
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                No emergency traffic intervention was required during this monitoring session.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
