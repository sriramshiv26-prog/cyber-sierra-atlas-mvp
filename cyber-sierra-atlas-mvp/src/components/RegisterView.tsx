import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  Copy
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useFilters } from '../hooks/useFilters';
import { FindingDrawer } from './FindingDrawer';
import { Finding } from '../lib/schema';

export function RegisterView() {
  const { store } = useStore();
  const { filters, setFilters, applyFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);

  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);

  const filteredFindings = useMemo(() => {
    let results = applyFilters(store.findings);

    if (showOnlyOverdue) {
      results = results.filter(f =>
        f.due_date && new Date(f.due_date) < new Date() && f.status !== 'Closed' && f.status !== 'Resolved'
      );
    }

    if (showOnlyDuplicates) {
      results = results.filter(f =>
        f.duplicate_group_id || (f.is_confirmed_unique === false && !f.duplicate_group_id)
      );
    }

    return results;
  }, [store.findings, filters, applyFilters, showOnlyOverdue, showOnlyDuplicates]);

  const openFinding = (finding: Finding) => {
    setActiveFinding(finding);
    setIsOpen(true);
  };

  const severityColors = {
    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    Informational: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    'Open': <div className="w-2 h-2 rounded-full bg-red-500" />,
    'In Progress': <div className="w-2 h-2 rounded-full bg-blue-500" />,
    'Resolved': <div className="w-2 h-2 rounded-full bg-green-500" />,
    'Closed': <div className="w-2 h-2 rounded-full bg-slate-400" />,
    'Risk Accepted': <div className="w-2 h-2 rounded-full bg-purple-500" />,
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 bg-slate-50 dark:bg-slate-900">
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Findings Register</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Master record of all validated security findings.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search findings..." 
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cs-navy/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowOnlyOverdue(!showOnlyOverdue)}
            className={`p-2 border rounded-lg transition-colors font-medium text-xs flex items-center gap-2 px-3 ${
              showOnlyOverdue
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Clock size={16} />
            Overdue Only
          </button>
          <button
            onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
            className={`p-2 border rounded-lg transition-colors font-medium text-xs flex items-center gap-2 px-3 ${
              showOnlyDuplicates
                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Copy size={16} />
            Duplicates Only
          </button>
          <button className="p-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Finding</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Severity</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Asset</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Due Date</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Flags</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p>No findings match your current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFindings.map(f => (
                  <tr 
                    key={f.id} 
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => openFinding(f)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[f.status] || <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        <span className="text-sm text-slate-600 dark:text-slate-400">{f.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cs-navy dark:group-hover:text-cs-cyan-400 transition-colors">
                          {f.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
                          {f.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tight ${severityColors[f.severity] || 'bg-slate-100 text-slate-700'}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {f.asset_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock size={14} />
                        {f.due_date ? new Date(f.due_date).toLocaleDateString() : 'No date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {f.duplicate_group_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold">
                            <Copy size={10} /> Duplicate
                          </span>
                        ) : f.is_confirmed_unique === true ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-bold">
                            ✓ Unique
                          </span>
                        ) : f.is_confirmed_unique === false && !f.duplicate_group_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-[10px] font-bold">
                            ? Review
                          </span>
                        ) : null}

                        {f.due_date && new Date(f.due_date) < new Date() && f.status !== 'Closed' && f.status !== 'Resolved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[10px] font-bold">
                            <Clock size={10} /> Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-400">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <FindingDrawer 
          finding={activeFinding} 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
