import React from 'react';
import { Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardMetrics, Trends } from '../../types/dashboard';
import { computeRiskScore } from '../../services/dashboardService';

interface ExecutiveViewProps {
  metrics: DashboardMetrics;
  trends: Trends;
}

/**
 * Executive view component
 * Displays high-level risk score, key metrics summary, and 90-day trends
 * Minimal, executive-focused presentation
 */
export const ExecutiveView: React.FC<ExecutiveViewProps> = ({ metrics, trends }) => {
  // Detect dark mode from HTML element class
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  // Calculate risk score based on metrics
  const riskScore = React.useMemo(() => {
    const totalCritical = metrics.severity.critical;
    const totalHigh = metrics.severity.high;
    const slaNonCompliance = 100 - metrics.sla.percentCompliant;
    const capaIncomplete = 100 - metrics.capa.percentComplete;

    let score = 0;
    score += Math.min(60, totalCritical * 15);
    score += Math.min(50, totalHigh * 5);
    score += slaNonCompliance > 10 ? 20 : slaNonCompliance;
    score += capaIncomplete > 20 ? 20 : capaIncomplete * 0.8;

    return Math.min(100, Math.round(score));
  }, [metrics]);

  // Determine risk color
  const getRiskColor = (score: number) => {
    if (score < 30) return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
    if (score < 60) return { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
  };

  const riskColor = getRiskColor(riskScore);
  const trend90 = trends.days90 && trends.days90.length > 0 ? trends.days90 : [];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Score - Large Card */}
        <div className={`lg:col-span-1 ${riskColor.bg} rounded-lg p-8 border-2 border-slate-200 dark:border-slate-700`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className={`w-6 h-6 ${riskColor.text}`} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Risk Score</h2>
          </div>
          <div className="text-center py-4">
            <div className={`text-6xl font-bold ${riskColor.text}`}>{riskScore}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {riskScore < 30 ? 'Low Risk' : riskScore < 60 ? 'Medium Risk' : 'High Risk'}
            </div>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Critical Findings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Critical Findings</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{metrics.severity.critical}</div>
          </div>

          {/* CAPA Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">CAPA Complete</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.capa.percentComplete}%</div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">SLA Compliant</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.sla.percentCompliant}%</div>
          </div>

          {/* MTTR */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Avg Resolution Time</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.mttr.current}d</div>
          </div>
        </div>
      </div>

      {/* 90-Day Trend Line */}
      {trend90.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">90-Day Trend</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend90}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="dark:text-slate-400"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="dark:text-slate-400"
                  yAxisId="left"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  className="dark:text-slate-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                  }}
                  labelFormatter={(date) => {
                    const d = new Date(date as string);
                    return d.toLocaleDateString();
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="openFindings"
                  stroke="#dc2626"
                  dot={false}
                  name="Open Findings"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="slaCompliance"
                  stroke="#16a34a"
                  dot={false}
                  name="SLA Compliance %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
