import React, { useState } from 'react';
import { FilterCriteria } from '../../types/dashboard';

interface FilterBarProps {
  onFilter: (criteria: FilterCriteria) => void;
}

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const STATUSES = ['open', 'in_progress', 'resolved', 'at_risk', 'overdue'] as const;

export function FilterBar({ onFilter }: FilterBarProps) {
  const [severity, setSeverity] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSeverityToggle = (sev: string) => {
    setSeverity(prev =>
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    );
  };

  const handleStatusToggle = (stat: string) => {
    setStatus(prev =>
      prev.includes(stat) ? prev.filter(s => s !== stat) : [...prev, stat]
    );
  };

  const handleApplyFilter = () => {
    const criteria: FilterCriteria = {};
    if (severity.length > 0) {
      criteria.severity = severity as FilterCriteria['severity'];
    }
    if (status.length > 0) {
      criteria.status = status as FilterCriteria['status'];
    }
    if (startDate || endDate) {
      criteria.dateRange = {
        start: startDate || '1970-01-01',
        end: endDate || new Date().toISOString().split('T')[0],
      };
    }
    onFilter(criteria);
  };

  const handleClear = () => {
    setSeverity([]);
    setStatus([]);
    setStartDate('');
    setEndDate('');
    onFilter({});
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      {/* Severity Filter */}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Severity
        </legend>
        <div className="flex flex-wrap gap-4">
          {SEVERITIES.map(sev => (
            <label key={sev} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={severity.includes(sev)}
                onChange={() => handleSeverityToggle(sev)}
                aria-label={`Filter by ${sev} severity`}
                className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                {sev}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Status Filter */}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Status
        </legend>
        <div className="flex flex-wrap gap-4">
          {STATUSES.map(stat => (
            <label key={stat} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={status.includes(stat)}
                onChange={() => handleStatusToggle(stat)}
                aria-label={`Filter by ${stat} status`}
                className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                {stat.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Date Range Filter */}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Date Range
        </legend>
        <div className="flex gap-4">
          <div>
            <label htmlFor="start-date" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleApplyFilter}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition"
        >
          Apply Filter
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
