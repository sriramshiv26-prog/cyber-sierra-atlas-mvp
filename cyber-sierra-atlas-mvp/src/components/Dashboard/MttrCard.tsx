import React from 'react';
import { Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface MttrCardProps {
  mttr: {
    current: number;
    trend: 'improving' | 'stable' | 'degrading';
  };
  onClick: () => void;
}

/**
 * Mean Time To Resolution card
 * Displays average days to resolve findings with trend
 */
export const MttrCard: React.FC<MttrCardProps> = ({ mttr, onClick }) => {
  return (
    <div className="relative">
      {/* Wrapper for icon */}
      <div className="absolute top-4 right-4 z-10">
        <Clock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </div>
      <MetricCard
        title="MTTR"
        value={mttr.current}
        unit="days"
        trend={mttr.trend}
        onClick={onClick}
      />
    </div>
  );
};
