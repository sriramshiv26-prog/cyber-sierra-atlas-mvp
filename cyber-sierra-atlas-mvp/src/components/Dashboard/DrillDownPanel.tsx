import React, { useState, useEffect } from 'react';
import { FilterCriteria } from '../../types/dashboard';
import { FilterBar } from './FilterBar';
import { ResultsList } from './ResultsList';

interface Result {
  id: string;
  title: string;
  severity?: string;
  status: string;
  createdAt: string;
  type: 'finding' | 'capa';
}

interface DrillDownPanelProps {
  isOpen: boolean;
  results: Result[];
  filter: FilterCriteria;
  isLoading?: boolean;
  onClose: () => void;
  onFilter: (criteria: FilterCriteria) => void;
  onRowClick?: (result: Result) => void;
}

const PAGE_SIZE = 10;

export function DrillDownPanel({
  isOpen,
  results,
  filter,
  isLoading = false,
  onClose,
  onFilter,
  onRowClick,
}: DrillDownPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Drill-down filter results"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Drill-Down Results
            </h2>
            <button
              onClick={onClose}
              aria-label="Close drill-down panel"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Filter Bar */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Filters
              </h3>
              <FilterBar onFilter={onFilter} />
            </div>

            {/* Results */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Results ({results.length})
              </h3>
              <ResultsList
                results={paginatedResults}
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onRowClick={onRowClick}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
