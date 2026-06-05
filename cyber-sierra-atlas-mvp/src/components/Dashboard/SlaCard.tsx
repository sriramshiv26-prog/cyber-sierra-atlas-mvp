import React from 'react';
import { Target } from 'lucide-react';

interface SlaCardProps {
  sla: {
    percentCompliant: number;
    overdueFindings: number;
    overdueCAPAs: number;
  };
  onClick: () => void;
}

/**
 * SLA Compliance card
 * Displays percentage compliant with overdue counts
 */
export const SlaCard: React.FC<SlaCardProps> = ({ sla, onClick }) => {
  // Determine color based on compliance percentage
  const getComplianceColor = (percent: number) => {
    if (percent >= 90) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
    if (percent >= 80) return { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
  };

  const colors = getComplianceColor(sla.percentCompliant);

  return (
    <button
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800
        rounded-lg p-6
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        cursor-pointer
        hover:shadow-lg
        active:scale-95
        text-left
        w-full
      `}
      aria-label={`SLA Compliance: ${sla.percentCompliant}%, ${sla.overdueFindings} overdue findings, ${sla.overdueCAPAs} overdue CAPAs`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-slate-900 dark:text-white font-semibold">SLA</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${colors.text}`}>{sla.percentCompliant}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">% compliant</span>
        </div>
      </div>

      {/* Overdue items */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-100 dark:bg-slate-700 rounded p-2">
          <div className="text-slate-600 dark:text-slate-300 font-medium">Overdue Findings</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{sla.overdueFindings}</div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700 rounded p-2">
          <div className="text-slate-600 dark:text-slate-300 font-medium">Overdue CAPAs</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{sla.overdueCAPAs}</div>
        </div>
      </div>
    </button>
  );
};
