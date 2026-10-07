import React from 'react';
import { Clock, Siren, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function DetectionTimeline({ events = [] }) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col h-full border-white/10">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
            Detection Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          LIVE EVENT LOG
        </span>
      </div>

      {/* Events Scrollable List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 space-y-2.5">
        {events.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            Awaiting traffic detection events...
          </div>
        ) : (
          events.map((evt) => {
            let icon = <Info className="w-3.5 h-3.5 text-slate-400" />;
            let badgeStyle = 'bg-slate-900 border-white/5 text-slate-300';

            if (evt.type === 'emergency' || evt.type === 'emergency-action') {
              icon = <Siren className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
              badgeStyle = 'bg-rose-950/40 border-rose-500/30 text-rose-200';
            } else if (evt.type === 'detection') {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />;
              badgeStyle = 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200';
            } else if (evt.type === 'success') {
              icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
              badgeStyle = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200';
            }

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-xs font-mono ${badgeStyle}`}
              >
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {evt.time}
                    </span>
                    <span className="text-slate-200 font-medium">
                      {evt.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
