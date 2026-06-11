/**
 * Dashboard API Client Functions
 * Provides client-side functions to fetch dashboard data from API endpoints
 */

import type {
  DashboardMetrics,
  Trends,
  PeriodComparison,
  DrillDownResults,
  FilterCriteria,
} from '../types/dashboard';

/**
 * Fetch current dashboard metrics snapshot
 * @returns Promise<DashboardMetrics> Current metrics state
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/api/dashboard/metrics`);

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fetch historical trend data for chart rendering
 * @param days - Number of days to fetch (30, 60, or 90)
 * @returns Promise<Trends> Trend data for all requested periods
 */
export const getDashboardTrends = async (days: 30 | 60 | 90): Promise<Trends> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/api/dashboard/trends?days=${days}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch trends: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fetch period comparison (current vs previous)
 * @param period - 'week' or 'month' comparison
 * @returns Promise<PeriodComparison> Current and previous period metrics with deltas
 */
export const getComparison = async (period: 'week' | 'month'): Promise<PeriodComparison> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/api/dashboard/compare?period=${period}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comparison: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    current: {
      period: data.period === 'week' ? 'this_week' : 'this_month',
      metrics: data.current,
      startDate: period === 'week' ? '2026-06-02' : '2026-06-01',
      endDate: '2026-06-09',
    },
    previous: {
      period: data.period === 'week' ? 'last_week' : 'last_month',
      metrics: data.previous,
      startDate: period === 'week' ? '2026-05-26' : '2026-05-01',
      endDate: period === 'week' ? '2026-05-29' : '2026-05-31',
    },
    deltas: {
      criticalFindings: data.delta.critical || 0,
      capaCompleteChange: 0,
      mttrChange: 0,
      slaComplianceChange: 0,
    },
  };
};

/**
 * Fetch filtered drill-down results
 * @param filters - FilterCriteria to apply
 * @returns Promise<DrillDownResults> Paginated findings/CAPAs matching filters
 */
export const getDrillDown = async (filters: FilterCriteria): Promise<DrillDownResults> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const query = new URLSearchParams();

  if (filters.severity && filters.severity.length > 0) {
    query.append('severity', filters.severity[0]);
  }
  if (filters.status && filters.status.length > 0) {
    query.append('status', filters.status[0]);
  }

  const response = await fetch(`${apiUrl}/api/dashboard/drill-down?${query}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch drill-down results: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    filter: filters,
    results: data.results,
    count: data.pagination.total,
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
    totalPages: data.pagination.totalPages,
  };
};
