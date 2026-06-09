import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ViewToggle } from './ViewToggle';
import { AnalystView } from './AnalystView';
import { ExecutiveView } from './ExecutiveView';
import { DrillDownPanel } from './DrillDownPanel';
import { getDashboardMetrics, getDashboardTrends, getDrillDown } from '../../api/dashboard';
import type { DashboardMetrics, Trends, FilterCriteria } from '../../types/dashboard';

/**
 * Main Dashboard Container Component
 * Manages metrics fetching, auto-refresh, and view state
 * Renders either Analyst or Executive view based on toggle
 */
interface DrillDownResult {
  id: string;
  title: string;
  severity?: string;
  status: string;
  createdAt: string;
  type: 'finding' | 'capa';
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [view, setView] = useState<'analyst' | 'executive'>('analyst');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownResults, setDrillDownResults] = useState<DrillDownResult[]>([]);
  const [drillDownFilter, setDrillDownFilter] = useState<FilterCriteria>({});
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  /**
   * Fetch metrics and trends from API
   */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsResponse, trendsResponse] = await Promise.all([
        getDashboardMetrics(),
        getDashboardTrends(90),
      ]);

      setMetrics(metricsResponse);
      setTrends(trendsResponse);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);

      // Retry in 30 seconds
      setTimeout(() => {
        setError(null);
      }, 30000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Set up auto-refresh interval (5 minutes)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  /**
   * Handle drill-down navigation
   */
  const handleDrillDown = async (metric: string, severity?: string) => {
    try {
      setDrillDownLoading(true);

      // Build filter criteria based on metric
      const filter: FilterCriteria = {};
      if (severity) {
        filter.severity = [severity as any];
      } else if (metric === 'severity') {
        filter.severity = ['critical', 'high', 'medium', 'low'];
      }

      // Fetch drill-down results
      const results = await getDrillDown(filter);
      setDrillDownResults(results.results || []);
      setDrillDownFilter(filter);
      setDrillDownOpen(true);
    } catch (err) {
      console.error('Drill-down fetch error:', err);
      setError('Failed to load drill-down results');
    } finally {
      setDrillDownLoading(false);
    }
  };

  /**
   * Handle drill-down filter updates
   */
  const handleDrillDownFilter = async (filter: FilterCriteria) => {
    try {
      setDrillDownLoading(true);
      const results = await getDrillDown(filter);
      setDrillDownResults(results.results || []);
      setDrillDownFilter(filter);
    } catch (err) {
      console.error('Filter error:', err);
      setError('Failed to apply filter');
    } finally {
      setDrillDownLoading(false);
    }
  };

  // Show error state
  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header lastRefresh={lastRefresh} onManualRefresh={fetchData} isLoading={isLoading} />
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-900 dark:text-red-200 font-semibold">Error loading dashboard</h3>
            <p className="text-red-800 dark:text-red-300 text-sm mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!metrics || !trends) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header lastRefresh={lastRefresh} onManualRefresh={fetchData} isLoading={true} />
        <div className="p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <Header lastRefresh={lastRefresh} onManualRefresh={fetchData} isLoading={isLoading} />

      {/* View Toggle */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">View</h2>
          <ViewToggle current={view} onChange={setView} />
        </div>
      </div>

      {/* Content */}
      {view === 'analyst' ? (
        <AnalystView
          metrics={metrics}
          trends={trends}
          isLoading={isLoading}
          onDrillDown={handleDrillDown}
        />
      ) : (
        <ExecutiveView metrics={metrics} trends={trends} />
      )}

      {/* Error Toast (when refreshing) */}
      {error && metrics && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white rounded-lg p-4 shadow-lg max-w-sm">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Drill-Down Panel Modal */}
      <DrillDownPanel
        isOpen={drillDownOpen}
        results={drillDownResults}
        filter={drillDownFilter}
        isLoading={drillDownLoading}
        onClose={() => setDrillDownOpen(false)}
        onFilter={handleDrillDownFilter}
        onRowClick={(result) => {
          console.log('Row clicked:', result);
          // TODO: Navigate to detail page
        }}
      />
    </div>
  );
};
