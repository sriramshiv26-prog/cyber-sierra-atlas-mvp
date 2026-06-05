import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  lastRefresh: Date;
  onManualRefresh: () => void;
  isLoading: boolean;
}

/**
 * Dashboard header component
 * Displays title, last refresh time, and manual refresh button
 */
export const Header: React.FC<HeaderProps> = ({ lastRefresh, onManualRefresh, isLoading }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Monitoring Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Updated {formatTime(lastRefresh)}</p>
        </div>
        <button
          onClick={onManualRefresh}
          disabled={isLoading}
          className={`
            flex items-center gap-2
            px-4 py-2
            rounded-lg
            font-medium
            transition-all duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            ${
              isLoading
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 cursor-pointer'
            }
          `}
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            role={isLoading ? 'status' : undefined}
          />
          Refresh
        </button>
      </div>
    </div>
  );
};
