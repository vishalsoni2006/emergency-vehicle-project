import React from 'react';
import TrafficSignal from './TrafficSignal';
import { Siren, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TrafficJunction({
  signals,
  emergencyData,
  mode,
}) {
  const isEmergency = mode === 'EMERGENCY';
  const emergencyLaneId = emergencyData?.laneId;
  const emergencyRoadId = emergencyData?.roadId;

  return (
    <div className="relative w-full aspect-square max-w-[680px] mx-auto glass-panel rounded-3xl p-4 md:p-6 overflow-hidden flex items-center justify-center border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Title Overlay Tag */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/5">
          JUNCTION 4-WAY INTERSECTION
        </span>
        {isEmergency && (
          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Siren className="w-3 h-3" /> PREEMPTION OVERRIDE ACTIVE
          </span>
        )}
      </div>

      {/* Main Intersection Canvas Container */}
      <div className="relative w-full h-full max-w-[560px] max-h-[560px]">
        {/* ============================================================== */}
        {/* ROADWAYS LAYOUT (Cross Shape) */}
        {/* ============================================================== */}

        {/* 1. North-South Roadway */}
        <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-36 md:w-44 bg-[#0a0f1d] border-x-2 border-slate-700/60 transition-all duration-500 ${
          isEmergency && (emergencyRoadId === 1 || emergencyRoadId === 3)
            ? 'shadow-[0_0_35px_rgba(244,63,94,0.3)]'
            : ''
        }`}>
          {/* North Road Centerline (Yellow Solid Double Line) */}
          <div className="absolute top-0 bottom-[60%] left-1/2 -translate-x-1/2 w-1 border-r border-amber-500/80 opacity-70" />
          
          {/* South Road Centerline */}
          <div className="absolute top-[60%] bottom-0 left-1/2 -translate-x-1/2 w-1 border-r border-amber-500/80 opacity-70" />

          {/* North Lane Dashed Line (Between Lane 1 and Lane 2) */}
          <div className="absolute top-0 bottom-[60%] left-1/4 w-0.5 border-r border-dashed border-white/40" />
          <div className="absolute top-0 bottom-[60%] right-1/4 w-0.5 border-r border-dashed border-white/40" />

          {/* South Lane Dashed Line (Between Lane 5 and Lane 6) */}
          <div className="absolute top-[60%] bottom-0 left-1/4 w-0.5 border-r border-dashed border-white/40" />
          <div className="absolute top-[60%] bottom-0 right-1/4 w-0.5 border-r border-dashed border-white/40" />

          {/* North Zebra Pedestrian Crossing */}
          <div className="absolute top-[28%] left-0 right-0 h-6 flex justify-between px-2 pointer-events-none opacity-60">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-full bg-white rounded-[1px]" />
            ))}
          </div>

          {/* South Zebra Pedestrian Crossing */}
          <div className="absolute bottom-[28%] left-0 right-0 h-6 flex justify-between px-2 pointer-events-none opacity-60">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-full bg-white rounded-[1px]" />
            ))}
          </div>
        </div>

        {/* 2. East-West Roadway */}
        <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-36 md:h-44 bg-[#0a0f1d] border-y-2 border-slate-700/60 transition-all duration-500 ${
          isEmergency && (emergencyRoadId === 2 || emergencyRoadId === 4)
            ? 'shadow-[0_0_35px_rgba(244,63,94,0.3)]'
            : ''
        }`}>
          {/* West Road Centerline */}
          <div className="absolute left-0 right-[60%] top-1/2 -translate-y-1/2 h-1 border-b border-amber-500/80 opacity-70" />
          
          {/* East Road Centerline */}
          <div className="absolute left-[60%] right-0 top-1/2 -translate-y-1/2 h-1 border-b border-amber-500/80 opacity-70" />

          {/* West Lane Dashed Line (Between Lane 7 and Lane 8) */}
          <div className="absolute left-0 right-[60%] top-1/4 h-0.5 border-b border-dashed border-white/40" />
          <div className="absolute left-0 right-[60%] bottom-1/4 h-0.5 border-b border-dashed border-white/40" />

          {/* East Lane Dashed Line (Between Lane 3 and Lane 4) */}
          <div className="absolute left-[60%] right-0 top-1/4 h-0.5 border-b border-dashed border-white/40" />
          <div className="absolute left-[60%] right-0 bottom-1/4 h-0.5 border-b border-dashed border-white/40" />

          {/* West Zebra Pedestrian Crossing */}
          <div className="absolute left-[28%] top-0 bottom-0 w-6 flex flex-col justify-between py-2 pointer-events-none opacity-60">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-2 w-full bg-white rounded-[1px]" />
            ))}
          </div>

          {/* East Zebra Pedestrian Crossing */}
          <div className="absolute right-[28%] top-0 bottom-0 w-6 flex flex-col justify-between py-2 pointer-events-none opacity-60">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-2 w-full bg-white rounded-[1px]" />
            ))}
          </div>
        </div>

        {/* 3. Central Junction Node (The Crossing Core) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-44 md:h-44 bg-[#0d1424] border border-white/10 rounded-lg flex items-center justify-center z-10">
          {/* Yellow Intersection Diagonal Hash Warning */}
          <div className="absolute inset-2 border-2 border-dashed border-amber-400/25 rounded-md pointer-events-none" />
          
          <div className="text-center p-2">
            <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              INTERSECTION
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              CCTV AI CONTROL
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROAD 1 (NORTH): LANES 1 & 2 + SIGNAL 1 */}
        {/* ============================================================== */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
          <div className="text-[10px] font-mono font-bold text-slate-300 tracking-wider mb-1 flex items-center gap-1">
            <span>ROAD 1 (NORTH)</span>
          </div>

          <div className="flex gap-2 items-center">
            {/* Lane 1 */}
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 1
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              LANE 1 ↓
            </div>

            {/* Lane 2 */}
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 2
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              LANE 2 ↓
            </div>
          </div>
        </div>

        {/* Signal 1 Placement (Right of North road above stop line) */}
        <div className="absolute top-[18%] left-[64%] z-30">
          <TrafficSignal
            signalId={1}
            roadName="Road 1"
            state={signals[1].state}
            timer={signals[1].timer}
            isPriority={emergencyRoadId === 1}
            compact={true}
          />
        </div>

        {/* ============================================================== */}
        {/* ROAD 2 (EAST): LANES 3 & 4 + SIGNAL 2 */}
        {/* ============================================================== */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-end z-30">
          <div className="text-[10px] font-mono font-bold text-slate-300 tracking-wider mb-1">
            ROAD 2 (EAST)
          </div>

          <div className="flex flex-col gap-1.5 items-end">
            {/* Lane 3 */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 3
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              ← LANE 3
            </div>

            {/* Lane 4 */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 4
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              ← LANE 4
            </div>
          </div>
        </div>

        {/* Signal 2 Placement (Below East road stop line) */}
        <div className="absolute top-[64%] right-[18%] z-30">
          <TrafficSignal
            signalId={2}
            roadName="Road 2"
            state={signals[2].state}
            timer={signals[2].timer}
            isPriority={emergencyRoadId === 2}
            compact={true}
          />
        </div>

        {/* ============================================================== */}
        {/* ROAD 3 (SOUTH): LANES 5 & 6 + SIGNAL 3 */}
        {/* ============================================================== */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
          <div className="flex gap-2 items-center mb-1">
            {/* Lane 5 */}
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 5
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              ↑ LANE 5
            </div>

            {/* Lane 6 */}
            <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 6
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              ↑ LANE 6
            </div>
          </div>

          <div className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
            ROAD 3 (SOUTH)
          </div>
        </div>

        {/* Signal 3 Placement (Left of South road below stop line) */}
        <div className="absolute bottom-[18%] left-[24%] z-30">
          <TrafficSignal
            signalId={3}
            roadName="Road 3"
            state={signals[3].state}
            timer={signals[3].timer}
            isPriority={emergencyRoadId === 3}
            compact={true}
          />
        </div>

        {/* ============================================================== */}
        {/* ROAD 4 (WEST): LANES 7 & 8 + SIGNAL 4 */}
        {/* ============================================================== */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-start z-30">
          <div className="text-[10px] font-mono font-bold text-slate-300 tracking-wider mb-1">
            ROAD 4 (WEST)
          </div>

          <div className="flex flex-col gap-1.5 items-start">
            {/* Lane 7 */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 7
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              LANE 7 →
            </div>

            {/* Lane 8 */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              emergencyLaneId === 8
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e] ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-white/10'
            }`}>
              LANE 8 →
            </div>
          </div>
        </div>

        {/* Signal 4 Placement (Above West road stop line) */}
        <div className="absolute top-[18%] left-[18%] z-30">
          <TrafficSignal
            signalId={4}
            roadName="Road 4"
            state={signals[4].state}
            timer={signals[4].timer}
            isPriority={emergencyRoadId === 4}
            compact={true}
          />
        </div>

        {/* Emergency Flow Laser Guide when an ambulance is traversing */}
        {isEmergency && emergencyRoadId && (
          <div className="absolute inset-0 pointer-events-none z-15">
            {emergencyRoadId === 3 && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1/2 bg-gradient-to-t from-rose-500/30 via-rose-500/15 to-transparent animate-pulse" />
            )}
            {emergencyRoadId === 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1/2 bg-gradient-to-b from-rose-500/30 via-rose-500/15 to-transparent animate-pulse" />
            )}
            {emergencyRoadId === 2 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-16 bg-gradient-to-l from-rose-500/30 via-rose-500/15 to-transparent animate-pulse" />
            )}
            {emergencyRoadId === 4 && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-16 bg-gradient-to-r from-rose-500/30 via-rose-500/15 to-transparent animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
