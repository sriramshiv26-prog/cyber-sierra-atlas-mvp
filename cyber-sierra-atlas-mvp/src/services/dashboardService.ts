/**
 * Dashboard Service Layer
 * Provides aggregation logic for dashboard metrics
 *
 * For MVP Phase 6B: Returns hardcoded sample data
 * Future optimization: Add database queries with indexes on:
 * - findings: (status, severity, created_at)
 * - capa_items: (state, due_date, created_at)
 */

import type {
  DashboardMetrics,
  TrendPoint,
  PeriodComparison,
  FilterCriteria,
} from '../types/dashboard';

/**
 * Compute severity breakdown from findings
 * Returns count of open findings by severity level
 *
 * Future: Replace with database query:
 * SELECT severity, COUNT(*) FROM findings
 * WHERE status='open' AND deleted_at IS NULL
 * GROUP BY severity;
 */
export const computeSeverityBreakdown = async (): Promise<
  DashboardMetrics['severity']
> => {
  // MVP: Return hardcoded counts
  return { critical: 3, high: 12, medium: 45, low: 102 };
};

/**
 * Compute CAPA metrics from capa_items
 * Returns completion percentage and status breakdown
 *
 * Future: Replace with database query:
 * SELECT
 *   ROUND(100.0 * COUNT(CASE WHEN state='closed' THEN 1 END) / COUNT(*)) as percentComplete,
 *   COUNT(CASE WHEN state='implementing' THEN 1 END) as inProgress,
 *   COUNT(CASE WHEN due_date < NOW() AND state != 'closed' THEN 1 END) as overdue
 * FROM capa_items
 * WHERE deleted_at IS NULL;
 */
export const computeCapaMetrics = async (): Promise<
  DashboardMetrics['capa']
> => {
  // MVP: Return hardcoded CAPA stats
  return { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 };
};

/**
 * Compute Mean Time To Resolution (MTTR)
 * Average days from finding creation to closure (last 30 days)
 * Also determines trend direction
 *
 * Future: Replace with database query:
 * SELECT
 *   ROUND(AVG(EXTRACT(DAY FROM (closed_at - created_at)))) as current,
 *   CASE WHEN current < prev_mttr THEN 'improving'
 *        WHEN current > prev_mttr THEN 'degrading'
 *        ELSE 'stable' END as trend
 * FROM findings
 * WHERE closed_at IS NOT NULL
 *   AND created_at >= NOW() - INTERVAL '30 days'
 *   AND deleted_at IS NULL;
 */
export const computeMTTR = async (): Promise<
  DashboardMetrics['mttr']
> => {
  // MVP: Return hardcoded MTTR
  return { current: 14, trend: 'improving' };
};

/**
 * Compute SLA Compliance
 * Percentage of findings/CAPAs closed within SLA window
 *
 * Future: Replace with database query:
 * SELECT
 *   ROUND(100.0 * COUNT(CASE WHEN closed_at <= sla_due_date THEN 1 END) / COUNT(*)) as percentCompliant,
 *   COUNT(CASE WHEN resolved_at IS NULL AND (NOW() > sla_due_date) THEN 1 END) as overdueFindings,
 *   COUNT(CASE WHEN state != 'closed' AND (NOW() > due_date) THEN 1 END) as overdueCAPAs
 * FROM findings LEFT JOIN capa_items ...;
 */
export const computeSLACompliance = async (): Promise<
  DashboardMetrics['sla']
> => {
  // MVP: Return hardcoded SLA
  return { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 };
};

/**
 * Get trend data for time-series charting
 * Returns daily snapshots of key metrics over requested period
 *
 * Future: Replace with database query with date grouping:
 * SELECT
 *   DATE(created_at) as date,
 *   COUNT(CASE WHEN status='open' THEN 1 END) as openFindings,
 *   COUNT(CASE WHEN status='closed' THEN 1 END) as closedFindings,
 *   ROUND(AVG(EXTRACT(DAY FROM (closed_at - created_at)))) as mttrDays,
 *   ...
 * FROM findings
 * WHERE created_at >= NOW() - INTERVAL '{days} days'
 * GROUP BY DATE(created_at)
 * ORDER BY date ASC;
 */
export const getTrendData = async (days: 30 | 60 | 90): Promise<TrendPoint[]> => {
  // MVP: Generate sample trend data
  const trends: TrendPoint[] = [];
  for (let i = days; i > 0; i--) {
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

/**
 * Get period comparison data
 * Compares current period metrics to previous period and calculates deltas
 *
 * Future: Add caching with Redis or in-memory cache to avoid
 * repeated computation of metrics for same date ranges
 */
export const getComparisonData = async (
  period: 'week' | 'month'
): Promise<PeriodComparison> => {
  // MVP: Return sample comparison
  const currentMetrics = {
    severity: await computeSeverityBreakdown(),
    capa: await computeCapaMetrics(),
    mttr: await computeMTTR(),
    sla: await computeSLACompliance(),
    updatedAt: new Date().toISOString(),
  };

  const previousSeverity = {
    ...currentMetrics.severity,
    critical: Math.max(0, currentMetrics.severity.critical - 2),
  };

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
        capa: { percentComplete: 70, inProgress: 16, atRisk: 9, overdue: 3 },
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
 * Drill-down query with filtering
 * Returns paginated results of findings/CAPAs matching filter criteria
 *
 * Future: Build dynamic WHERE clause from FilterCriteria:
 * WHERE (severity IN (...) OR severity IS NULL)
 *   AND (status IN (...) OR status IS NULL)
 *   AND (created_at BETWEEN ? AND ? OR date_range IS NULL)
 *   AND (team IN (...) OR team IS NULL)
 */
export const drillDown = async (
  filters: FilterCriteria,
  page: number = 1,
  pageSize: number = 10
): Promise<{ count: number; results: unknown[] }> => {
  // MVP: Return empty results with filter structure
  // Filters are validated client-side; server-side validation added in Phase 2
  return { count: 0, results: [] };
};

/**
 * Compute risk score (0-100) for executive dashboard
 * Weighted combination of severity, SLA compliance, and CAPA completion
 * Future: Make weights configurable
 */
export const computeRiskScore = async (): Promise<number> => {
  const metrics = {
    severity: await computeSeverityBreakdown(),
    capa: await computeCapaMetrics(),
    sla: await computeSLACompliance(),
  };

  // Weight calculation (MVP):
  // - Critical: 15 points each (max 60 for 4 critical)
  // - High: 5 points each (max 50 for 10 high)
  // - SLA non-compliance: 20 points (if <85%)
  // - CAPA incomplete: 20 points (if <70%)
  // - Max score: 100
  let score = 0;

  score += Math.min(60, metrics.severity.critical * 15);
  score += Math.min(50, metrics.severity.high * 5);

  if (metrics.sla.percentCompliant < 85) {
    score += 20 * ((85 - metrics.sla.percentCompliant) / 85);
  }

  if (metrics.capa.percentComplete < 70) {
    score += 20 * ((70 - metrics.capa.percentComplete) / 70);
  }

  return Math.min(100, Math.round(score));
};

/**
 * Export dashboardService object with all functions
 * Enables dependency injection and easier mocking in tests
 */
export const dashboardService = {
  computeSeverityBreakdown,
  computeCapaMetrics,
  computeMTTR,
  computeSLACompliance,
  getTrendData,
  getComparisonData,
  drillDown,
  computeRiskScore,
};
