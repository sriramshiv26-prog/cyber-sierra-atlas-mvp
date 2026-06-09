import React from 'react';

interface Result {
  id: string;
  title: string;
  severity?: string;
  status: string;
  createdAt: string;
  type: 'finding' | 'capa';
}

interface ResultsListProps {
  results: Result[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick?: (result: Result) => void;
  isLoading?: boolean;
}

export function ResultsList({
  results,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onRowClick,
  isLoading = false,
}: ResultsListProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-red-600 dark:text-red-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'resolved':
        return 'text-green-600 dark:text-green-400';
      case 'at_risk':
        return 'text-orange-600 dark:text-orange-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            role="status"
            aria-label="Loading results"
            className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-2 text-slate-900 dark:text-white font-semibold">
                Title
              </th>
              {true && (
                <th className="text-left px-4 py-2 text-slate-900 dark:text-white font-semibold">
                  Severity
                </th>
              )}
              <th className="text-left px-4 py-2 text-slate-900 dark:text-white font-semibold">
                Status
              </th>
              <th className="text-left px-4 py-2 text-slate-900 dark:text-white font-semibold">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr
                key={result.id}
                onClick={() => onRowClick?.(result)}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onRowClick?.(result);
                  }
                }}
                aria-label={`${result.title}, status: ${result.status}`}
              >
                <td className="px-4 py-2 text-slate-900 dark:text-white truncate">
                  {result.title}
                </td>
                {result.severity && (
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                        result.severity
                      )}`}
                    >
                      {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
                    </span>
                  </td>
                )}
                <td className="px-4 py-2">
                  <span className={`font-medium ${getStatusColor(result.status)}`}>
                    {result.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                  {new Date(result.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Page {currentPage} of {totalPages} ({results.length} items)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
