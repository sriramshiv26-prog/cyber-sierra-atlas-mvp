import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend?: 'improving' | 'stable' | 'degrading';
  onClick?: () => void;
  isLoading?: boolean;
}

/**
 * Reusable metric card component
 * Displays a metric value with optional trend indicator
 * Accessible with aria-labels and keyboard navigation
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  onClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        role="status"
        className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 animate-pulse"
      >
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" />
      </div>
    );
  }

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'degrading' ? TrendingDown : Minus;
  const trendColor =
    trend === 'improving' ? 'text-green-600 dark:text-green-400' : trend === 'degrading' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400';

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${title}: ${value} ${unit}${trend ? `, ${trend}` : ''}`}
      className={`
        bg-white dark:bg-slate-800
        rounded-xl p-6
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:border-blue-400 dark:hover:border-blue-400 active:scale-95 group' : ''}
        ${!onClick ? 'cursor-default' : ''}
      `}
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-slate-900 dark:text-white group-hover:scale-110 transition-transform">{value}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{unit}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 ${trend === 'improving' ? 'text-green-600 dark:text-green-400' : trend === 'degrading' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
            <div className={`p-1 rounded ${trend === 'improving' ? 'bg-green-50 dark:bg-green-900/20' : trend === 'degrading' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700'}`}>
              <TrendIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold capitalize">{trend}</span>
          </div>
        )}
      </div>
    </Component>
  );
};
