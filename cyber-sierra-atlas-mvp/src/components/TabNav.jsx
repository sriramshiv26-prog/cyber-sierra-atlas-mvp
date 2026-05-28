import React from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'register', label: 'Register', icon: '📋' },
  { id: 'blast', label: 'Blast Radius', icon: '💥' },
  { id: 'crosswalk', label: 'Crosswalk', icon: '🔀' },
  { id: 'genealogy', label: 'Genealogy', icon: '🌳' },
  { id: 'reports', label: 'Reports', icon: '📄' },
];

export function TabNav({ view, onViewChange }) {
  return (
    <div className="flex gap-1 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
            view === tab.id
              ? 'bg-cs-light dark:bg-slate-800 text-cs-navy dark:text-white border border-cs-cyan-light'
              : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
