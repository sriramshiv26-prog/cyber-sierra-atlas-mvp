import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { Trends } from '../../types/dashboard';

interface TrendsCardProps {
  trends: Trends;
}

/**
 * Trends chart card
 * Displays 30/60/90 day trend data using Recharts
 * Allows toggling between different time periods
 */
export const TrendsCard: React.FC<TrendsCardProps> = ({ trends }) => {
  const [period, setPeriod] = useState<'30' | '60' | '90'>('30');
  const [metric, setMetric] = useState<'openFindings' | 'mttrDays' | 'slaCompliance' | 'capaCompletePercent'>('openFindings');

  const data = {
    30: trends.days30,
    60: trends.days60,
    90: trends.days90,
  }[period];

  const metricConfig = {
    openFindings: { label: 'Open Findings', color: '#dc2626', key: 'openFindings' },
    mttrDays: { label: 'MTTR (days)', color: '#2563eb', key: 'mttrDays' },
    slaCompliance: { label: 'SLA Compliance %', color: '#16a34a', key: 'slaCompliance' },
    capaCompletePercent: { label: 'CAPA Complete %', color: '#7c3aed', key: 'capaCompletePercent' },
  };

  const config = metricConfig[metric];

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <h3 className="text-slate-900 dark:text-white font-semibold">Trends</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <h3 className="text-slate-900 dark:text-white font-semibold">Trends</h3>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-4">
        {(['30', '60', '90'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`
              px-3 py-1
              rounded
              text-xs
              font-medium
              transition-all duration-200
              ${
                period === p
                  ? 'bg-blue-600 dark:bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }
            `}
          >
            {p}d
          </button>
        ))}
      </div>

      {/* Metric selector */}
      <div className="mb-4">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
          className={`
            w-full
            px-3
            py-2
            rounded
            text-sm
            border border-slate-200 dark:border-slate-600
            bg-white dark:bg-slate-700
            text-slate-900 dark:text-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          `}
        >
          {Object.entries(metricConfig).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#f3f4f6',
              }}
              labelFormatter={(date) => {
                const d = new Date(date as string);
                return d.toLocaleDateString();
              }}
              formatter={(value) => [value, config.label]}
            />
            <Line
              type="monotone"
              dataKey={config.key}
              stroke={config.color}
              dot={false}
              isAnimationActive={true}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
