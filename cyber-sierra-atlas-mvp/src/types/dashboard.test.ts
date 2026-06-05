import { describe, it, expect } from 'vitest';
import type {
  DashboardMetrics,
  TrendPoint,
  Trends,
  PeriodComparison,
  FilterCriteria,
  DrillDownResults,
} from './dashboard';

describe('Dashboard Types', () => {
  describe('DashboardMetrics', () => {
    it('should have all required severity fields', () => {
      const metrics: DashboardMetrics = {
        severity: { critical: 3, high: 12, medium: 45, low: 102 },
        capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
        mttr: { current: 14, trend: 'improving' },
        sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
        updatedAt: new Date().toISOString(),
      };
      expect(metrics.severity.critical).toBe(3);
      expect(metrics.severity.high).toBe(12);
      expect(metrics.severity.medium).toBe(45);
      expect(metrics.severity.low).toBe(102);
    });

    it('should have all required CAPA fields', () => {
      const metrics: DashboardMetrics = {
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
        mttr: { current: 14, trend: 'stable' },
        sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
        updatedAt: new Date().toISOString(),
      };
      expect(metrics.capa.percentComplete).toBe(73);
      expect(metrics.capa.inProgress).toBe(15);
      expect(metrics.capa.atRisk).toBe(8);
      expect(metrics.capa.overdue).toBe(2);
    });

    it('should support MTTR trend values', () => {
      const improving: DashboardMetrics = {
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        capa: { percentComplete: 0, inProgress: 0, atRisk: 0, overdue: 0 },
        mttr: { current: 14, trend: 'improving' },
        sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
        updatedAt: new Date().toISOString(),
      };
      expect(['improving', 'stable', 'degrading']).toContain(improving.mttr.trend);
    });

    it('should have valid updatedAt timestamp', () => {
      const metrics: DashboardMetrics = {
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        capa: { percentComplete: 0, inProgress: 0, atRisk: 0, overdue: 0 },
        mttr: { current: 14, trend: 'stable' },
        sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
        updatedAt: '2026-06-05T10:30:00Z',
      };
      expect(new Date(metrics.updatedAt).getTime()).toBeGreaterThan(0);
    });
  });

  describe('TrendPoint', () => {
    it('should have all required fields', () => {
      const point: TrendPoint = {
        date: '2026-06-05',
        openFindings: 165,
        closedFindings: 28,
        mttrDays: 16,
        slaCompliance: 82,
        capaCompletePercent: 68,
      };
      expect(point.date).toBe('2026-06-05');
      expect(point.openFindings).toBe(165);
      expect(point.closedFindings).toBe(28);
      expect(point.mttrDays).toBe(16);
      expect(point.slaCompliance).toBe(82);
      expect(point.capaCompletePercent).toBe(68);
    });

    it('should accept date in YYYY-MM-DD format', () => {
      const point: TrendPoint = {
        date: '2026-01-01',
        openFindings: 0,
        closedFindings: 0,
        mttrDays: 0,
        slaCompliance: 100,
        capaCompletePercent: 100,
      };
      expect(/^\d{4}-\d{2}-\d{2}$/.test(point.date)).toBe(true);
    });
  });

  describe('Trends', () => {
    it('should contain days30, days60, days90 arrays', () => {
      const trends: Trends = {
        days30: Array(30).fill(null).map((_, i) => ({
          date: `2026-05-${String(i + 1).padStart(2, '0')}`,
          openFindings: 160,
          closedFindings: 25,
          mttrDays: 14,
          slaCompliance: 83,
          capaCompletePercent: 70,
        })),
        days60: [],
        days90: [],
      };
      expect(trends.days30).toHaveLength(30);
      expect(Array.isArray(trends.days60)).toBe(true);
      expect(Array.isArray(trends.days90)).toBe(true);
    });

    it('should support empty trend arrays', () => {
      const trends: Trends = {
        days30: [],
        days60: [],
        days90: [],
      };
      expect(trends.days30).toHaveLength(0);
      expect(trends.days60).toHaveLength(0);
      expect(trends.days90).toHaveLength(0);
    });
  });

  describe('PeriodComparison', () => {
    it('should have current and previous period data', () => {
      const comparison: PeriodComparison = {
        current: {
          period: 'this_week',
          metrics: {
            severity: { critical: 3, high: 12, medium: 45, low: 102 },
            capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
            mttr: { current: 14, trend: 'improving' },
            sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
            updatedAt: '2026-06-05T10:30:00Z',
          },
          startDate: '2026-06-02',
          endDate: '2026-06-05',
        },
        previous: {
          period: 'last_week',
          metrics: {
            severity: { critical: 1, high: 14, medium: 48, low: 105 },
            capa: { percentComplete: 70, inProgress: 16, atRisk: 9, overdue: 3 },
            mttr: { current: 16, trend: 'stable' },
            sla: { percentCompliant: 84, overdueFindings: 3, overdueCAPAs: 2 },
            updatedAt: '2026-05-29T10:30:00Z',
          },
          startDate: '2026-05-26',
          endDate: '2026-05-29',
        },
        deltas: {
          criticalFindings: 2,
          capaCompleteChange: 3,
          mttrChange: -2,
          slaComplianceChange: 1,
        },
      };
      expect(comparison.current.period).toBe('this_week');
      expect(comparison.previous.period).toBe('last_week');
      expect(comparison.deltas.criticalFindings).toBe(2);
    });

    it('should support month comparison', () => {
      const comparison: PeriodComparison = {
        current: {
          period: 'this_month',
          metrics: {
            severity: { critical: 0, high: 0, medium: 0, low: 0 },
            capa: { percentComplete: 0, inProgress: 0, atRisk: 0, overdue: 0 },
            mttr: { current: 0, trend: 'stable' },
            sla: { percentCompliant: 100, overdueFindings: 0, overdueCAPAs: 0 },
            updatedAt: new Date().toISOString(),
          },
          startDate: '2026-06-01',
          endDate: '2026-06-05',
        },
        previous: {
          period: 'last_month',
          metrics: {
            severity: { critical: 0, high: 0, medium: 0, low: 0 },
            capa: { percentComplete: 0, inProgress: 0, atRisk: 0, overdue: 0 },
            mttr: { current: 0, trend: 'stable' },
            sla: { percentCompliant: 100, overdueFindings: 0, overdueCAPAs: 0 },
            updatedAt: new Date().toISOString(),
          },
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        },
        deltas: {
          criticalFindings: 0,
          capaCompleteChange: 0,
          mttrChange: 0,
          slaComplianceChange: 0,
        },
      };
      expect(comparison.current.period).toBe('this_month');
      expect(comparison.previous.period).toBe('last_month');
    });
  });

  describe('FilterCriteria', () => {
    it('should have optional severity filter', () => {
      const filter: FilterCriteria = {
        severity: ['critical', 'high'],
      };
      expect(filter.severity).toEqual(['critical', 'high']);
    });

    it('should have optional status filter', () => {
      const filter: FilterCriteria = {
        status: ['open', 'in_progress'],
      };
      expect(filter.status).toEqual(['open', 'in_progress']);
    });

    it('should have optional date range filter', () => {
      const filter: FilterCriteria = {
        dateRange: { start: '2026-06-01', end: '2026-06-05' },
      };
      expect(filter.dateRange?.start).toBe('2026-06-01');
      expect(filter.dateRange?.end).toBe('2026-06-05');
    });

    it('should have optional team filter', () => {
      const filter: FilterCriteria = {
        team: ['team-1', 'team-2'],
      };
      expect(filter.team).toEqual(['team-1', 'team-2']);
    });

    it('should allow empty filter', () => {
      const filter: FilterCriteria = {};
      expect(Object.keys(filter).length).toBe(0);
    });

    it('should support combined filters', () => {
      const filter: FilterCriteria = {
        severity: ['critical'],
        status: ['open'],
        dateRange: { start: '2026-06-01', end: '2026-06-05' },
        team: ['security-team'],
      };
      expect(filter.severity).toBeDefined();
      expect(filter.status).toBeDefined();
      expect(filter.dateRange).toBeDefined();
      expect(filter.team).toBeDefined();
    });
  });

  describe('DrillDownResults', () => {
    it('should have all required pagination fields', () => {
      const results: DrillDownResults = {
        filter: { severity: ['critical'] },
        results: [],
        count: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(10);
      expect(results.totalPages).toBe(0);
      expect(results.count).toBe(0);
    });

    it('should support multiple pages', () => {
      const results: DrillDownResults = {
        filter: {},
        results: Array(10).fill(null),
        count: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      };
      expect(results.count).toBe(25);
      expect(results.totalPages).toBe(3);
      expect(results.results).toHaveLength(10);
    });

    it('should include filter criteria in results', () => {
      const filter: FilterCriteria = {
        severity: ['critical', 'high'],
        status: ['open'],
      };
      const results: DrillDownResults = {
        filter,
        results: [],
        count: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
      expect(results.filter).toEqual(filter);
    });
  });
});
