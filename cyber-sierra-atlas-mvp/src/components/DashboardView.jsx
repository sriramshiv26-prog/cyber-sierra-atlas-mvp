import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarAngleAxis, PolarRadiusAxis, PolarGrid, Radar
} from 'recharts';
import { Download } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { exportFindingsAsCSV, exportStoreAsJSON, exportFindingsAsMarkdown, downloadFile } from '../lib/export';
import { buildSeverityAgeHeatMap, buildAssetRiskProfiles, SEVERITY_LEVELS, AGE_BRACKETS } from '../lib/chart-utils';
import { OverdueDetailModal } from './OverdueDetailModal';

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
  const [showOverdueModal, setShowOverdueModal] = useState(false);

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
  const overdueCount = findings.filter(f =>
    f.due_date && new Date(f.due_date) < new Date() && f.status !== 'Closed' && f.status !== 'Resolved'
  ).length;

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

  // Severity × Age Heat Map
  const heatMapData = useMemo(() => buildSeverityAgeHeatMap(findings), [findings]);

  // Asset Risk Spider Chart Data
  const assetRiskProfiles = useMemo(() => buildAssetRiskProfiles(findings), [findings]);

  // Asset Risk Ranking for Bar Chart
  const assetRankingData = useMemo(() =>
    assetRiskProfiles.map(profile => ({
      name: profile.assetName,
      riskScore: Math.round(profile.totalRiskScore),
      level: profile.totalRiskScore >= 70 ? 'High' :
             profile.totalRiskScore >= 50 ? 'Medium' : 'Low'
    })),
    [assetRiskProfiles]
  );

  const getRiskColor = (score) => {
    if (score >= 70) return '#C9432B';
    if (score >= 50) return '#E5733A';
    return '#2E8AB0';
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPITile label="Total Findings" value={total} color="bg-blue-500" trend="+12%" />
        <KPITile label="Active Risk" value={openCount} color="bg-yellow-500" />
        <KPITile label="Critical (Open)" value={criticalOpen} color="bg-red-500" />
        <div
          onClick={() => overdueCount > 0 && setShowOverdueModal(true)}
          className={overdueCount > 0 ? 'cursor-pointer' : ''}
        >
          <KPITile label="Overdue Items" value={overdueCount} color="bg-orange-500" />
        </div>
        <KPITile label="Unique Assets" value={assetsCount} color="bg-purple-500" />
      </div>

      {/* Asset Risk Ranking (Bar Chart) */}
      {assetRankingData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Top 5 Assets: Risk Ranking</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetRankingData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis dataKey="name" type="category" width={145} tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`${value}/100`, 'Risk Score']}
                />
                <Bar dataKey="riskScore" fill="#C9432B" radius={[0, 8, 8, 0]}>
                  {assetRankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <p>Normalized risk score 0-100: combines vulnerability count, severity, open %, overdue items, and control effectiveness</p>
          </div>
        </div>
      )}

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

        {/* Asset Risk Profile (Spider Chart) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Top 5 Assets: Risk Profile</h3>
          <div className="h-[300px] w-full">
            {assetRiskProfiles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={assetRiskProfiles[0]?.dimensions || []}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{fontSize: 11, fill: '#64748b'}}
                    angle={90}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                  />
                  <Radar
                    name={assetRiskProfiles[0]?.assetName}
                    dataKey="value"
                    stroke="#C9432B"
                    fill="#C9432B"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <p>No assets to display</p>
              </div>
            )}
          </div>
          {assetRiskProfiles.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                Showing: {assetRiskProfiles[0]?.assetName}
              </p>
              <p>Radar shows 5 dimensions: Count, Severity, Open, Overdue, Control Weakness</p>
            </div>
          )}
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

      {/* Severity × Age Heat Map */}
      {heatMapData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-6">Severity × Age Heat Map</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">Severity</th>
                  {AGE_BRACKETS.map(bracket => (
                    <th key={bracket.label} className="p-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                      {bracket.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEVERITY_LEVELS.map(severity => (
                  <tr key={severity}>
                    <td className="p-2 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50">
                      {severity}
                    </td>
                    {AGE_BRACKETS.map(bracket => {
                      const cell = heatMapData.find(c => c.severity === severity && c.age === bracket.label);
                      return (
                        <td
                          key={`${severity}-${bracket.label}`}
                          className="p-3 text-center font-semibold text-slate-900 dark:text-white rounded"
                          style={{
                            backgroundColor: cell?.color || '#f3f4f6',
                            color: (cell?.count || 0) > 0 ? 'white' : '#6b7280'
                          }}
                        >
                          {cell?.count || 0}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Legend:</p>
            <p>Green zones = newer findings | Orange/Red zones = older findings (URGENT)</p>
            <p className="mt-1">Shows findings by severity level and age in days from due date</p>
          </div>
        </div>
      )}

      {/* Overdue Detail Modal */}
      <OverdueDetailModal
        findings={findings}
        isOpen={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
      />
    </div>
  );
}
