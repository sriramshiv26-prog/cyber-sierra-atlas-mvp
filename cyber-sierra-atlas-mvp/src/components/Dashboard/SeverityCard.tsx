import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SeverityCardProps {
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  onClick: (level: 'critical' | 'high' | 'medium' | 'low') => void;
}

/**
 * Severity breakdown card
 * Displays 4 mini cards (Critical, High, Medium, Low) with counts
 * Each mini card is clickable for drill-down
 */
export const SeverityCard: React.FC<SeverityCardProps> = ({ severity, onClick }) => {
  const levels: Array<{
    key: 'critical' | 'high' | 'medium' | 'low';
    label: string;
    color: string;
    bgColor: string;
  }> = [
    { key: 'critical', label: 'Critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'high', label: 'High', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { key: 'medium', label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { key: 'low', label: 'Low', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <h3 className="text-slate-900 dark:text-white font-semibold">Severity</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {levels.map(({ key, label, color, bgColor }) => (
          <button
            key={key}
            onClick={() => onClick(key)}
            className={`
              ${bgColor}
              rounded-lg p-3
              border border-slate-200 dark:border-slate-600
              transition-all duration-200
              hover:shadow-md
              active:scale-95
              cursor-pointer
            `}
            aria-label={`${label} findings: ${severity[key]}`}
          >
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{severity[key]}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
