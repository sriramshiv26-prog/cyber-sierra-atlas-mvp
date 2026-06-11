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
    <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cyber Sierra Atlas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Updated {formatTime(lastRefresh)}
            </span>
          </p>
        </div>
        <button
          onClick={onManualRefresh}
          disabled={isLoading}
          className={`
            flex items-center gap-2
            px-5 py-2.5
            rounded-lg
            font-semibold
            text-sm
            transition-all duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-blue-500
            dark:focus:ring-offset-slate-800
            ${
              isLoading
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 hover:shadow-lg cursor-pointer active:scale-95'
            }
          `}
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            role={isLoading ? 'status' : undefined}
          />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
