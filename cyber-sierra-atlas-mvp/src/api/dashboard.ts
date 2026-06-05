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
  // For MVP: Return sample data
  // In Phase 2, replace with actual API call:
  // const response = await fetch('/api/dashboard/metrics');
  // const { data } = await response.json();
  // return data;

  return {
    severity: { critical: 3, high: 12, medium: 45, low: 102 },
    capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
    mttr: { current: 14, trend: 'improving' },
    sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Fetch historical trend data for chart rendering
 * @param days - Number of days to fetch (30, 60, or 90)
 * @returns Promise<Trends> Trend data for all requested periods
 */
export const getDashboardTrends = async (days: 30 | 60 | 90): Promise<Trends> => {
  // For MVP: Return sample trend data
  // In Phase 2, replace with actual API call:
  // const response = await fetch(`/api/dashboard/trends?days=${days}`);
  // const { data } = await response.json();
  // return data;

  const generateTrends = (count: number) => {
    const trends = [];
    for (let i = count; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        openFindings: Math.max(0, 160 + Math.floor(Math.random() * 20 - 10)),
        closedFindings: Math.max(0, 25 + Math.floor(Math.random() * 10)),
        mttrDays: Math.max(0, 14 + Math.floor(Math.random() * 4 - 2)),
        slaCompliance: Math.max(0, Math.min(100, 83 + Math.floor(Math.random() * 5 - 2))),
        capaCompletePercent: Math.max(0, Math.min(100, 70 + Math.floor(Math.random() * 5))),
      });
    }
    return trends;
  };

  return {
    days30: generateTrends(30),
    days60: generateTrends(60),
    days90: generateTrends(90),
  };
};

/**
 * Fetch period comparison (current vs previous)
 * @param period - 'week' or 'month' comparison
 * @returns Promise<PeriodComparison> Current and previous period metrics with deltas
 */
export const getComparison = async (period: 'week' | 'month'): Promise<PeriodComparison> => {
  // For MVP: Return sample comparison
  // In Phase 2, replace with actual API call:
  // const response = await fetch(`/api/dashboard/compare?period=${period}`);
  // const { data } = await response.json();
  // return data;

  const currentMetrics = await getDashboardMetrics();
  const previousSeverity = { ...currentMetrics.severity, critical: Math.max(0, currentMetrics.severity.critical - 2) };
  const previousCapa = { ...currentMetrics.capa, percentComplete: Math.max(0, currentMetrics.capa.percentComplete - 3) };

  return {
    current: {
      period: period === 'week' ? 'this_week' : 'this_month',
      metrics: currentMetrics,
      startDate: period === 'week' ? '2026-06-02' : '2026-06-01',
      endDate: '2026-06-05',
    },
    previous: {
      period: period === 'week' ? 'last_week' : 'last_month',
      metrics: {
        severity: previousSeverity,
        capa: previousCapa,
        mttr: { current: 16, trend: 'stable' },
        sla: { percentCompliant: 84, overdueFindings: 3, overdueCAPAs: 2 },
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      startDate: period === 'week' ? '2026-05-26' : '2026-05-01',
      endDate: period === 'week' ? '2026-05-29' : '2026-05-31',
    },
    deltas: {
      criticalFindings: 2,
      capaCompleteChange: 3,
      mttrChange: -2,
      slaComplianceChange: 1,
    },
  };
};

/**
 * Fetch filtered drill-down results
 * @param filters - FilterCriteria to apply
 * @returns Promise<DrillDownResults> Paginated findings/CAPAs matching filters
 */
export const getDrillDown = async (filters: FilterCriteria): Promise<DrillDownResults> => {
  // For MVP: Return empty results with filter structure
  // In Phase 2, replace with actual API call:
  // const query = new URLSearchParams();
  // if (filters.severity) query.append('severity', filters.severity.join(','));
  // if (filters.status) query.append('status', filters.status.join(','));
  // if (filters.dateRange) {
  //   query.append('startDate', filters.dateRange.start);
  //   query.append('endDate', filters.dateRange.end);
  // }
  // if (filters.team) query.append('team', filters.team.join(','));
  // const response = await fetch(`/api/dashboard/drill-down?${query}`);
  // const { data } = await response.json();
  // return data;

  return {
    filter: filters,
    results: [],
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  };
};
