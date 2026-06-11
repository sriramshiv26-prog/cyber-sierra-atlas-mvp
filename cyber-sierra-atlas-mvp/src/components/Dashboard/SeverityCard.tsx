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
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-lg">Severity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Findings by severity level</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {levels.map(({ key, label, color, bgColor }) => (
          <button
            key={key}
            onClick={() => onClick(key)}
            className={`
              ${bgColor}
              rounded-lg p-4
              border border-slate-200 dark:border-slate-600
              transition-all duration-200
              hover:shadow-lg hover:scale-105
              active:scale-95
              cursor-pointer
              group
            `}
            aria-label={`${label} findings: ${severity[key]}`}
          >
            <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-2 uppercase tracking-wide">{label}</div>
            <div className={`text-3xl font-bold ${color} group-hover:scale-110 transition-transform`}>{severity[key]}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
