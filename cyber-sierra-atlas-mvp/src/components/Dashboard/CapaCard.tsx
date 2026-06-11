import React from 'react';
import { CheckCircle } from 'lucide-react';

interface CapaCardProps {
  capa: {
    percentComplete: number;
    inProgress: number;
    atRisk: number;
    overdue: number;
  };
  onClick: () => void;
}

/**
 * CAPA completion card
 * Displays percentage complete with breakdown of statuses
 */
export const CapaCard: React.FC<CapaCardProps> = ({ capa, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800
        rounded-xl p-6
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        cursor-pointer
        hover:shadow-lg hover:scale-105
        active:scale-95
        text-left
        w-full
        group
      `}
      aria-label={`CAPA completion: ${capa.percentComplete}%, ${capa.inProgress} in progress, ${capa.atRisk} at risk`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-lg">CAPA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Corrective actions</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{capa.percentComplete}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">% complete</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${capa.percentComplete}%` }}
            role="progressbar"
            aria-valuenow={capa.percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
          <div className="text-slate-600 dark:text-slate-300 font-medium">In Progress</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{capa.inProgress}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
          <div className="text-slate-600 dark:text-slate-300 font-medium">At Risk</div>
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{capa.atRisk}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
          <div className="text-slate-600 dark:text-slate-300 font-medium">Overdue</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">{capa.overdue}</div>
        </div>
      </div>
    </button>
  );
};
