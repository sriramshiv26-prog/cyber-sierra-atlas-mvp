/**
 * Dashboard Metrics Interface
 * Represents the current state of key security metrics
 * @readonly - computed from findings and CAPA data
 */
export interface DashboardMetrics {
  severity: {
    critical: number;      // Count of open Critical findings
    high: number;          // Count of open High findings
    medium: number;        // Count of open Medium findings
    low: number;           // Count of open Low findings
  };
  capa: {
    percentComplete: number;     // 0-100
    inProgress: number;          // Count of CAPAs in "in_progress" state
    atRisk: number;              // Count of CAPAs approaching due date
    overdue: number;             // Count of CAPAs past due date
  };
  mttr: {
    current: number;        // Days, average of last 30 days
    trend: 'improving' | 'stable' | 'degrading';
  };
  sla: {
    percentCompliant: number;    // 0-100
    overdueFindings: number;
    overdueCAPAs: number;
  };
  updatedAt: string;  // ISO8601 timestamp
}

/**
 * Single data point for trend data
 * Represents metrics at a specific point in time
 */
export interface TrendPoint {
  date: string;  // YYYY-MM-DD
  openFindings: number;
  closedFindings: number;
  mttrDays: number;
  slaCompliance: number;
  capaCompletePercent: number;
}

/**
 * Trend data across multiple time periods
 * Contains 30, 60, and 90-day snapshots for charting
 */
export interface Trends {
  days30: TrendPoint[];    // Last 30 daily snapshots
  days60: TrendPoint[];    // Last 60 daily snapshots (includes 30)
  days90: TrendPoint[];    // Last 90 daily snapshots (includes 60 + 30)
}

/**
 * Period-over-period comparison
 * Compares current period metrics to previous period with deltas
 */
export interface PeriodComparison {
  current: {
    period: 'this_week' | 'this_month';
    metrics: DashboardMetrics;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
  };
  previous: {
    period: 'last_week' | 'last_month';
    metrics: DashboardMetrics;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
  };
  deltas: {
    criticalFindings: number;     // +3 or -2
    capaCompleteChange: number;   // +5 (percent points)
    mttrChange: number;           // +2 or -1 (days)
    slaComplianceChange: number;  // +2 or -1 (percent points)
  };
}

/**
 * Filter criteria for drill-down searches
 */
export interface FilterCriteria {
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
  status?: ('open' | 'in_progress' | 'resolved' | 'at_risk' | 'overdue')[];
  dateRange?: { start: string; end: string };  // YYYY-MM-DD format
  team?: string[];
}

/**
 * Results from drill-down filtering
 * Contains paginated findings or CAPA items matching filter criteria
 */
export interface DrillDownResults {
  filter: FilterCriteria;
  results: unknown[];  // Finding | CAPA (using unknown for MVP)
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
