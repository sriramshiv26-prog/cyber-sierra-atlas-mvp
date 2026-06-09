import React, { useState } from 'react';
import { SeverityCard } from './SeverityCard';
import { CapaCard } from './CapaCard';
import { MttrCard } from './MttrCard';
import { SlaCard } from './SlaCard';
import { TrendsCard } from './TrendsCard';
import { ComparisonView } from './ComparisonView';
import type { DashboardMetrics, Trends, PeriodComparison } from '../../types/dashboard';

interface AnalystViewProps {
  metrics: DashboardMetrics;
  trends: Trends;
  isLoading: boolean;
  onDrillDown: (metric: string, severity?: string) => void;
  comparison?: PeriodComparison | null;
  comparisonLoading?: boolean;
  onFetchComparison?: (period: 'week' | 'month') => void;
}

/**
 * Analyst view component
 * Displays detailed metrics with drill-down capabilities
 * 5 cards in responsive 3-column layout (desktop), 2-column (tablet), 1-column (mobile)
 */
export const AnalystView: React.FC<AnalystViewProps> = ({
  metrics,
  trends,
  isLoading,
  onDrillDown,
  comparison,
  comparisonLoading = false,
  onFetchComparison,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  // Generate array of loading skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            role="status"
            className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Severity Breakdown */}
        <SeverityCard
          severity={metrics.severity}
          onClick={(level) => onDrillDown('severity', level)}
        />

        {/* Card 2: CAPA Completion */}
        <CapaCard capa={metrics.capa} onClick={() => onDrillDown('capa')} />

        {/* Card 3: MTTR */}
        <MttrCard mttr={metrics.mttr} onClick={() => onDrillDown('mttr')} />

        {/* Card 4: SLA Compliance */}
        <SlaCard sla={metrics.sla} onClick={() => onDrillDown('sla')} />

        {/* Card 5: 30/60/90 Day Trends */}
        <div className="lg:col-span-1 md:col-span-2">
          <TrendsCard trends={trends} />
        </div>
      </div>

      {/* Period Comparison Toggle */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            setShowComparison(!showComparison);
            if (!showComparison && onFetchComparison) {
              onFetchComparison('week');
            }
          }}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition"
        >
          {showComparison ? 'Hide Comparison' : 'Show Comparison'}
        </button>
      </div>

      {/* Period Comparison View */}
      {showComparison && (
        <div className="mt-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onFetchComparison?.('week')}
              className={`px-3 py-1 text-sm font-medium rounded transition ${
                comparison?.current.period === 'this_week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onFetchComparison?.('month')}
              className={`px-3 py-1 text-sm font-medium rounded transition ${
                comparison?.current.period === 'this_month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Month
            </button>
          </div>
          <ComparisonView comparison={comparison} isLoading={comparisonLoading} />
        </div>
      )}
    </div>
  );
};
