import React, { useMemo } from 'react';
import { Grid3X3, AlertTriangle } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const FRAMEWORKS = ['NIST 800-53', 'ISO 27001', 'CIS Controls', 'HIPAA', 'PCI-DSS', 'SOC 2', 'GDPR'];

const SEVERITY_COLORS = {
  Critical: '#C9432B',
  High: '#E5733A',
  Medium: '#C99A2B',
  Low: '#2E8AB0',
  Informational: '#64748B',
};

export function CrosswalkView() {
  const { store } = useStore();
  const { findings } = store;

  // Extract unique controls from findings
  const controls = useMemo(() => {
    const controlSet = new Set();
    findings.forEach(f => {
      if (f.control_framework) {
        controlSet.add(f.control_framework);
      }
    });
    return Array.from(controlSet).sort();
  }, [findings]);

  // Build matrix: control → framework → coverage
  const matrix = useMemo(() => {
    const data = {};
    controls.forEach(ctrl => {
      data[ctrl] = {};
      FRAMEWORKS.forEach(fw => {
        // Find findings mapped to both this control AND this framework
        const matching = findings.filter(f => {
          const hasControl = f.control_framework === ctrl;
          const hasFramework = fw.toLowerCase().includes(f.control_framework?.toLowerCase() || '');
          return hasControl || (f.control_framework && f.control_framework.includes(fw));
        });

        const critical = matching.filter(f => f.severity === 'Critical').length;
        const high = matching.filter(f => f.severity === 'High').length;
        const medium = matching.filter(f => f.severity === 'Medium').length;

        data[ctrl][fw] = {
          total: matching.length,
          critical,
          high,
          medium,
          status: critical > 0 ? 'critical' : high > 0 ? 'high' : medium > 0 ? 'medium' : 'empty',
        };
      });
    });
    return data;
  }, [findings, controls]);

  function getCellBgColor(status) {
    switch (status) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-700/50';
    }
  }

  function getCellTextColor(status) {
    switch (status) {
      case 'critical':
        return 'text-red-700 dark:text-red-400';
      case 'high':
        return 'text-orange-700 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-700 dark:text-yellow-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  }

  return (
    <div className="p-8 h-full flex flex-col gap-8 bg-slate-50 dark:bg-slate-900 overflow-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Framework Crosswalk</h1>
        <p className="text-slate-500 dark:text-slate-400">Security findings mapped to compliance frameworks and controls.</p>
      </div>

      {controls.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-96">
          <Grid3X3 size={48} className="mb-4 opacity-20" />
          <p>No findings with control mappings. Import findings first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <table className="w-full border-collapse bg-white dark:bg-slate-800">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                <th className="sticky left-0 bg-slate-50 dark:bg-slate-700 text-left px-4 py-4 font-bold text-slate-900 dark:text-white text-sm w-56 z-10 border-r border-slate-200 dark:border-slate-600">
                  Control
                </th>
                {FRAMEWORKS.map(fw => (
                  <th
                    key={fw}
                    className="text-center px-4 py-4 font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-600 last:border-r-0 min-w-32"
                  >
                    {fw}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {controls.map((ctrl, ctrlIdx) => (
                <tr
                  key={ctrl}
                  className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    ctrlIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <td className="sticky left-0 bg-inherit text-left px-4 py-4 font-semibold text-slate-900 dark:text-white text-sm z-10 border-r border-slate-200 dark:border-slate-600">
                    {ctrl}
                  </td>
                  {FRAMEWORKS.map(fw => {
                    const cell = matrix[ctrl][fw];
                    return (
                      <td
                        key={`${ctrl}-${fw}`}
                        className={`text-center px-4 py-4 text-sm font-semibold ${getCellBgColor(cell.status)} ${getCellTextColor(cell.status)} border-r border-slate-200 dark:border-slate-600 last:border-r-0 transition-colors`}
                      >
                        {cell.total > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-base font-bold">{cell.total}</span>
                            {cell.critical > 0 && <span className="text-[10px] font-bold">CR: {cell.critical}</span>}
                            {cell.high > 0 && cell.critical === 0 && <span className="text-[10px] font-bold">HI: {cell.high}</span>}
                            {cell.medium > 0 && cell.critical === 0 && cell.high === 0 && <span className="text-[10px] font-bold">MD: {cell.medium}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {controls.length > 0 && (
        <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></div>
            <span>Critical Finding (CR)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"></div>
            <span>High Finding (HI)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800"></div>
            <span>Medium Finding (MD)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"></div>
            <span>No Findings</span>
          </div>
        </div>
      )}
    </div>
  );
}
