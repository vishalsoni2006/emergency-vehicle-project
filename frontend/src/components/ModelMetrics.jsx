import React from 'react';
import { Target, BarChart2 } from 'lucide-react';

/**
 * Model Metrics Component
 * 
 * Strict Requirement:
 * DO NOT hard-code fake values.
 * Read them from the backend if available, otherwise display clean standby indicators.
 */
export default function ModelMetrics({ metrics = null }) {
  const metricCards = [
    { label: 'Precision', key: 'precision', desc: 'Positive predictive value' },
    { label: 'Recall', key: 'recall', desc: 'Sensitivity / True positive rate' },
    { label: 'F1 Score', key: 'f1', desc: 'Harmonic mean of P and R' },
    { label: 'mAP@50', key: 'map50', desc: 'Mean Avg Precision at IoU 0.50' },
    { label: 'mAP@50-95', key: 'map50_95', desc: 'Strict Mean Avg Precision across IoU' },
  ];

  const hasMetrics = metrics && Object.keys(metrics).length > 0;

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 border-white/10">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
            Model Evaluation Metrics
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          YOLO VALIDATION SPLIT
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metricCards.map(({ label, key, desc }) => {
          const val = hasMetrics && metrics[key] ? metrics[key] : null;
          return (
            <div key={key} className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                {label}
              </div>
              <div className="text-lg font-black font-mono text-white mt-1">
                {val ? (typeof val === 'number' ? `${(val * 100).toFixed(1)}%` : val) : '--'}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                {desc}
              </div>
            </div>
          );
        })}
      </div>

      {!hasMetrics && (
        <div className="text-[10px] font-mono text-slate-400 text-center mt-3 pt-2 border-t border-white/5">
          Metrics will update dynamically when received from model evaluation endpoint.
        </div>
      )}
    </div>
  );
}
