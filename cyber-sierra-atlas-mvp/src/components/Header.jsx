import React from 'react';
import { Moon, Sun } from 'lucide-react';

export function Header({ view, onViewChange, theme, onThemeChange, density, onDensityChange, lastSaved }) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        
        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-cs-navy dark:text-white">
            Cyber Sierra Atlas
          </div>
          <span className="text-sm text-slate-500">/</span>
          <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
            {view.toUpperCase()}
          </span>
        </div>

        {/* Last saved + Theme + Density toggles */}
        <div className="flex items-center gap-6">
          
          {/* Last saved */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Saved: {new Date(lastSaved).toLocaleTimeString()}
          </div>

          {/* Density dropdown */}
          <select 
            value={density} 
            onChange={(e) => onDensityChange(e.target.value)}
            className="px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          >
            <option value="comfy">Comfy</option>
            <option value="cosy">Cosy</option>
            <option value="compact">Compact</option>
          </select>

          {/* Theme toggle */}
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-slate-600" />
            ) : (
              <Sun size={20} className="text-slate-400" />
            )}
          </button>

          {/* Reset seed (dev button) */}
          <button
            onClick={() => {
              if (confirm('Reset all data and reload?')) {
                localStorage.removeItem('fr.store.v3');
                location.reload();
              }
            }}
            className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
