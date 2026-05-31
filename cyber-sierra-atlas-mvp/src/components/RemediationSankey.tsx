import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { Finding } from '../lib/schema';
import { buildSankeyData } from '../lib/sankey-transform';

interface RemediationSankeyProps {
  findings: Finding[];
}

const STATUS_COLORS = {
  open: '#EF4444',
  in_progress: '#F59E0B',
  scheduled: '#3B82F6',
  closed: '#10B981',
};

export function RemediationSankey({ findings }: RemediationSankeyProps) {
  const data = useMemo(() => buildSankeyData(findings), [findings]);

  if (findings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Remediation Flow</h3>
        <p className="text-slate-500 dark:text-slate-400">No findings to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Remediation Flow</h3>
      <ResponsiveContainer width="100%" height={500}>
        <Sankey
          data={data}
          nodePadding={100}
          margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px',
            }}
          />
        </Sankey>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {data.nodes.map((node, idx) => (
            <div key={idx} className="text-center">
              <p className="font-semibold">{node.value || 0}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                {node.name.replace(/_/g, ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
