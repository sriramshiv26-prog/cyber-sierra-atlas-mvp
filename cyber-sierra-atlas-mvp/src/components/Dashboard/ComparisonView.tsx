import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PeriodComparison } from '../../types/dashboard';

interface ComparisonViewProps {
  comparison: PeriodComparison | null;
  isLoading?: boolean;
}

export function ComparisonView({ comparison, isLoading = false }: ComparisonViewProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">No comparison data available</p>
      </div>
    );
  }

  const DeltaIndicator = ({ value }: { value: number }) => {
    if (value === 0) {
      return <span className="text-slate-500 dark:text-slate-400">No change</span>;
    }
    const isPositive = value > 0;
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
        <span className={isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
          {isPositive ? '+' : ''}{value}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Period Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Period */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Current ({comparison.current.period === 'this_week' ? 'Week' : 'Month'})
          </h4>
          <div className="text-xs text-slate-500 dark:text-slate-500 mb-3">
            {comparison.current.startDate} to {comparison.current.endDate}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">Critical:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {comparison.current.metrics.severity.critical}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">CAPA:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {comparison.current.metrics.capa.percentComplete}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">SLA:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {comparison.current.metrics.sla.percentCompliant}%
              </span>
            </div>
          </div>
        </div>

        {/* Previous Period */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Previous ({comparison.previous.period === 'last_week' ? 'Week' : 'Month'})
          </h4>
          <div className="text-xs text-slate-500 dark:text-slate-500 mb-3">
            {comparison.previous.startDate} to {comparison.previous.endDate}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">Critical:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {comparison.previous.metrics.severity.critical}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">CAPA:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {comparison.previous.metrics.capa.percentComplete}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700 dark:text-slate-300">SLA:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {comparison.previous.metrics.sla.percentCompliant}%
              </span>
            </div>
          </div>
        </div>

        {/* Deltas */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
            Change
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 text-sm">Critical Findings</span>
              <DeltaIndicator value={comparison.deltas.criticalFindings} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 text-sm">CAPA Complete</span>
              <DeltaIndicator value={comparison.deltas.capaCompleteChange} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 text-sm">MTTR (days)</span>
              <DeltaIndicator value={-comparison.deltas.mttrChange} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-300 text-sm">SLA Compliance</span>
              <DeltaIndicator value={comparison.deltas.slaComplianceChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
