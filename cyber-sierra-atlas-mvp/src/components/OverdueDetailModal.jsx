import React from 'react';
import { X, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { calculateOverdueStatus, getOverdueLabel } from '../lib/overdue';

export function OverdueDetailModal({ findings, isOpen, onClose }) {
  if (!isOpen || findings.length === 0) return null;

  const overdueFindings = findings.filter(f => {
    const status = calculateOverdueStatus(f);
    return status.isOverdue;
  });

  const overdueByDays = overdueFindings.sort((a, b) => {
    const statusA = calculateOverdueStatus(a);
    const statusB = calculateOverdueStatus(b);
    return statusB.daysOverdue - statusA.daysOverdue;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle size={24} className="text-orange-500" />
            Overdue Findings ({overdueByDays.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {overdueByDays.map(finding => {
            const status = calculateOverdueStatus(finding);
            const isWildlyOverdue = status.isWildlyOverdue;

            return (
              <div
                key={finding.id}
                className={`p-4 border rounded-lg ${
                  isWildlyOverdue
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {finding.title}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {finding.asset_name} • {finding.severity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      isWildlyOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {status.daysOverdue}d
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      past due
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Owner:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {finding.owner || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Status:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {finding.status}
                    </span>
                  </div>
                </div>

                {isWildlyOverdue && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/40 rounded border border-red-200 dark:border-red-700">
                    <TrendingUp size={14} className="text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      Risk score increased by 20% due to overdue status
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
