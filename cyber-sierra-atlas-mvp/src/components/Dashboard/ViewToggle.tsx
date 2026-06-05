import React from 'react';

interface ViewToggleProps {
  current: 'analyst' | 'executive';
  onChange: (view: 'analyst' | 'executive') => void;
}

/**
 * View toggle component
 * Allows switching between analyst and executive views
 * Accessible with ARIA attributes and keyboard navigation
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({ current, onChange }) => {
  return (
    <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      <button
        onClick={() => onChange('analyst')}
        aria-pressed={current === 'analyst'}
        className={`
          px-4 py-2
          rounded-md
          font-medium
          transition-all duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          ${
            current === 'analyst'
              ? 'bg-blue-600 dark:bg-blue-600 text-white'
              : 'bg-transparent dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        Analyst View
      </button>
      <button
        onClick={() => onChange('executive')}
        aria-pressed={current === 'executive'}
        className={`
          px-4 py-2
          rounded-md
          font-medium
          transition-all duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          ${
            current === 'executive'
              ? 'bg-blue-600 dark:bg-blue-600 text-white'
              : 'bg-transparent dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        Executive Summary
      </button>
    </div>
  );
};
