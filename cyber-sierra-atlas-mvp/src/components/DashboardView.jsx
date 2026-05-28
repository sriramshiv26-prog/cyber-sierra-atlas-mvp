import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Download } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { exportFindingsAsCSV, exportStoreAsJSON, exportFindingsAsMarkdown, downloadFile } from '../lib/export';

/**
 * Enterprise Dashboard Component
 * Focuses on risk distribution, compliance gaps, and operational KPIs.
 */

const SEVERITY_COLORS = {
  Critical: '#C9432B',
  High: '#E5733A',
  Medium: '#C99A2B',
  Low: '#2E8AB0',
  Informational: '#5A6E89',
};

function KPITile({ label, value, color, trend }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`w-2 h-2 rounded-full ${color}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        {trend && <span className="text-xs font-medium text-green-500">{trend}</span>}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { store } = useStore();
  const { findings } = store;

  // Export handlers
  const handleExportCSV = () => {
    const csv = exportFindingsAsCSV(findings);
    downloadFile(csv, `findings-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportStoreAsJSON(store);
    downloadFile(json, `atlas-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportMarkdown = () => {
    const md = exportFindingsAsMarkdown(findings, 'Security Findings Report');
    downloadFile(md, `findings-report-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
  };

  // Calculate Logic
  const total = findings.length;
  const openCount = findings.filter(f => f.status === 'Open').length;
  const criticalOpen = findings.filter(f => f.severity === 'Critical' && f.status === 'Open').length;
  const assetsCount = new Set(findings.map(f => f.asset_id)).size;

  // Severity Distribution for Pie Chart
  const severityData = Object.keys(SEVERITY_COLORS).map(sev => ({
    name: sev,
    value: findings.filter(f => f.severity === sev).length,
    fill: SEVERITY_COLORS[sev]
  })).filter(d => d.value > 0);

  // Asset Risk for Bar Chart
  const assetCounts = findings.reduce((acc, f) => {
    acc[f.asset_name] = (acc[f.asset_name] || 0) + 1;
    return acc;
  }, {});

  const assetData = Object.entries(assetCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Risk Velocity: Cumulative findings over time
  const velocityData = useMemo(() => {
    if (findings.length === 0) return [];

    // Group findings by date and count discovered vs closed
    const dateMap = new Map();
    findings.forEach(f => {
      const date = new Date(f.created_at).toLocaleDateString('en-US', {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      });

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, discovered: 0, closed: 0 });
      }
      const entry = dateMap.get(date);
      entry.discovered += 1;
      if (f.status === 'Closed' || f.status === 'Resolved') {
        entry.closed += 1;
      }
    });

    // Sort by date and calculate cumulative
    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    let cumulativeDiscovered = 0;
    let cumulativeClosed = 0;

    return sorted.map(entry => {
      cumulativeDiscovered += entry.discovered;
      cumulativeClosed += entry.closed;
      return {
        date: entry.date,
        discovered: cumulativeDiscovered,
        closed: cumulativeClosed,
        active: cumulativeDiscovered - cumulativeClosed
      };
    });
  }, [findings]);

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-full">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Risk Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time visibility into consolidated findings surface.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right text-xs text-slate-400">
            Last System Sync: {new Date(store.lastSaved).toLocaleString()}
          </div>
          {findings.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={14} /> Export MD
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPITile label="Total Findings" value={total} color="bg-blue-500" trend="+12%" />
        <KPITile label="Active Risk" value={openCount} color="bg-yellow-500" />
        <KPITile label="Critical (Open)" value={criticalOpen} color="bg-red-500" />
        <KPITile label="Unique Assets" value={assetsCount} color="bg-purple-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Severity Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Severity Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risk Assets */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Top 5 At-Risk Assets</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{fontSize: 12, fill: '#64748b'}}
                />
                <Tooltip
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#183B65" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Risk Velocity Chart */}
      {velocityData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Risk Velocity: Discovery vs Closure Rate</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{fontSize: 12, fill: '#64748b'}}
                />
                <YAxis
                  tick={{fontSize: 12, fill: '#64748b'}}
                />
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="discovered"
                  stroke="#2E8AB0"
                  strokeWidth={2}
                  name="Cumulative Discovered"
                  dot={{ fill: '#2E8AB0', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#16a766"
                  strokeWidth={2}
                  name="Cumulative Closed"
                  dot={{ fill: '#16a766', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#C9432B"
                  strokeWidth={2}
                  name="Currently Open"
                  dot={{ fill: '#C9432B', r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
