import React from 'react';
import { Grid } from 'lucide-react';

/**
 * Confusion Matrix Component
 * 
 * Strict Requirement:
 * DO NOT invent values.
 * If backend does not provide confusion-matrix data, display:
 * "Confusion matrix will appear here after model evaluation."
 */
export default function ConfusionMatrix({ matrixData = null }) {
  const hasData = matrixData && typeof matrixData.tp !== 'undefined';

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 border-white/10">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
            Model Performance — Confusion Matrix
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          EVALUATION SPLIT
        </span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-white/10 text-slate-400">Actual \ Predicted</th>
                <th className="p-2 border border-white/10 bg-slate-900/60 text-rose-300">Ambulance</th>
                <th className="p-2 border border-white/10 bg-slate-900/60 text-slate-300">No Ambulance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-white/10 bg-slate-900/60 font-bold text-rose-300">Ambulance</td>
                <td className="p-3 border border-white/10 bg-emerald-950/40 text-emerald-300 font-bold text-sm">
                  TP: {matrixData.tp}
                </td>
                <td className="p-3 border border-white/10 bg-rose-950/20 text-rose-300">
                  FN: {matrixData.fn}
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-white/10 bg-slate-900/60 font-bold text-slate-300">No Ambulance</td>
                <td className="p-3 border border-white/10 bg-amber-950/20 text-amber-300">
                  FP: {matrixData.fp}
                </td>
                <td className="p-3 border border-white/10 bg-slate-900/40 text-slate-300 font-bold text-sm">
                  TN: {matrixData.tn}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-mono text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-white/10">
          Confusion matrix will appear here after model evaluation.
        </div>
      )}
    </div>
  );
}
