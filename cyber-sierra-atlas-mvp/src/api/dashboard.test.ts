import { describe, it, expect } from 'vitest';
import { getDashboardMetrics, getDashboardTrends, getComparison, getDrillDown } from './dashboard';
import type { FilterCriteria } from '../types/dashboard';

describe('Dashboard API Client', () => {
  describe('getDashboardMetrics', () => {
    it('should return DashboardMetrics structure', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics).toHaveProperty('severity');
      expect(metrics).toHaveProperty('capa');
      expect(metrics).toHaveProperty('mttr');
      expect(metrics).toHaveProperty('sla');
      expect(metrics).toHaveProperty('updatedAt');
    });

    it('should have numeric severity counts', async () => {
      const metrics = await getDashboardMetrics();

      expect(typeof metrics.severity.critical).toBe('number');
      expect(typeof metrics.severity.high).toBe('number');
      expect(typeof metrics.severity.medium).toBe('number');
      expect(typeof metrics.severity.low).toBe('number');
    });

    it('should have valid CAPA metrics', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics.capa.percentComplete).toBeGreaterThanOrEqual(0);
      expect(metrics.capa.percentComplete).toBeLessThanOrEqual(100);
      expect(typeof metrics.capa.inProgress).toBe('number');
      expect(typeof metrics.capa.atRisk).toBe('number');
      expect(typeof metrics.capa.overdue).toBe('number');
    });

    it('should have valid MTTR data', async () => {
      const metrics = await getDashboardMetrics();

      expect(typeof metrics.mttr.current).toBe('number');
      expect(['improving', 'stable', 'degrading']).toContain(metrics.mttr.trend);
    });

    it('should have valid SLA compliance', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics.sla.percentCompliant).toBeGreaterThanOrEqual(0);
      expect(metrics.sla.percentCompliant).toBeLessThanOrEqual(100);
      expect(typeof metrics.sla.overdueFindings).toBe('number');
      expect(typeof metrics.sla.overdueCAPAs).toBe('number');
    });

    it('should have valid ISO8601 timestamp', async () => {
      const metrics = await getDashboardMetrics();

      expect(new Date(metrics.updatedAt).getTime()).toBeGreaterThan(0);
    });
  });

  describe('getDashboardTrends', () => {
    it('should return Trends with all required periods', async () => {
      const trends = await getDashboardTrends(90);

      expect(trends).toHaveProperty('days30');
      expect(trends).toHaveProperty('days60');
      expect(trends).toHaveProperty('days90');
    });

    it('should return 30 days of data for days30 period', async () => {
      const trends = await getDashboardTrends(30);

      expect(trends.days30).toHaveLength(30);
      expect(Array.isArray(trends.days30)).toBe(true);
    });

    it('should return 60 days of data for days60 period', async () => {
      const trends = await getDashboardTrends(60);

      expect(trends.days60).toHaveLength(60);
      expect(trends.days60[0]).toHaveProperty('date');
      expect(trends.days60[0]).toHaveProperty('openFindings');
    });

    it('should return 90 days of data for days90 period', async () => {
      const trends = await getDashboardTrends(90);

      expect(trends.days90).toHaveLength(90);
    });

    it('should have valid TrendPoint structure', async () => {
      const trends = await getDashboardTrends(30);

      trends.days30.forEach((point) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('openFindings');
        expect(point).toHaveProperty('closedFindings');
        expect(point).toHaveProperty('mttrDays');
        expect(point).toHaveProperty('slaCompliance');
        expect(point).toHaveProperty('capaCompletePercent');
        expect(/^\d{4}-\d{2}-\d{2}$/.test(point.date)).toBe(true);
      });
    });

    it('should have valid numeric values in TrendPoint', async () => {
      const trends = await getDashboardTrends(30);
      const point = trends.days30[0];

      expect(typeof point.openFindings).toBe('number');
      expect(typeof point.closedFindings).toBe('number');
      expect(typeof point.mttrDays).toBe('number');
      expect(point.slaCompliance).toBeGreaterThanOrEqual(0);
      expect(point.slaCompliance).toBeLessThanOrEqual(100);
      expect(point.capaCompletePercent).toBeGreaterThanOrEqual(0);
      expect(point.capaCompletePercent).toBeLessThanOrEqual(100);
    });
  });

  describe('getComparison', () => {
    it('should return PeriodComparison structure', async () => {
      const comparison = await getComparison('week');

      expect(comparison).toHaveProperty('current');
      expect(comparison).toHaveProperty('previous');
      expect(comparison).toHaveProperty('deltas');
    });

    it('should have current period data', async () => {
      const comparison = await getComparison('week');

      expect(comparison.current).toHaveProperty('period');
      expect(comparison.current).toHaveProperty('metrics');
      expect(comparison.current).toHaveProperty('startDate');
      expect(comparison.current).toHaveProperty('endDate');
    });

    it('should have previous period data', async () => {
      const comparison = await getComparison('week');

      expect(comparison.previous).toHaveProperty('period');
      expect(comparison.previous).toHaveProperty('metrics');
      expect(comparison.previous).toHaveProperty('startDate');
      expect(comparison.previous).toHaveProperty('endDate');
    });

    it('should have deltas calculated', async () => {
      const comparison = await getComparison('week');

      expect(comparison.deltas).toHaveProperty('criticalFindings');
      expect(comparison.deltas).toHaveProperty('capaCompleteChange');
      expect(comparison.deltas).toHaveProperty('mttrChange');
      expect(comparison.deltas).toHaveProperty('slaComplianceChange');
    });

    it('should support week comparison', async () => {
      const comparison = await getComparison('week');

      expect(comparison.current.period).toBe('this_week');
      expect(comparison.previous.period).toBe('last_week');
    });

    it('should support month comparison', async () => {
      const comparison = await getComparison('month');

      expect(comparison.current.period).toBe('this_month');
      expect(comparison.previous.period).toBe('last_month');
    });

    it('should have valid metrics in both periods', async () => {
      const comparison = await getComparison('week');

      expect(comparison.current.metrics).toHaveProperty('severity');
      expect(comparison.current.metrics).toHaveProperty('capa');
      expect(comparison.previous.metrics).toHaveProperty('severity');
      expect(comparison.previous.metrics).toHaveProperty('capa');
    });
  });

  describe('getDrillDown', () => {
    it('should return DrillDownResults structure', async () => {
      const results = await getDrillDown({});

      expect(results).toHaveProperty('filter');
      expect(results).toHaveProperty('results');
      expect(results).toHaveProperty('count');
      expect(results).toHaveProperty('page');
      expect(results).toHaveProperty('pageSize');
      expect(results).toHaveProperty('totalPages');
    });

    it('should preserve filter criteria', async () => {
      const filter: FilterCriteria = {
        severity: ['critical', 'high'],
        status: ['open'],
      };
      const results = await getDrillDown(filter);

      expect(results.filter).toEqual(filter);
    });

    it('should return array of results', async () => {
      const results = await getDrillDown({});

      expect(Array.isArray(results.results)).toBe(true);
    });

    it('should have valid pagination info', async () => {
      const results = await getDrillDown({});

      expect(typeof results.page).toBe('number');
      expect(typeof results.pageSize).toBe('number');
      expect(typeof results.totalPages).toBe('number');
      expect(typeof results.count).toBe('number');
    });

    it('should support empty filter', async () => {
      const results = await getDrillDown({});

      expect(results.filter).toEqual({});
    });

    it('should support severity filter', async () => {
      const filter: FilterCriteria = { severity: ['critical'] };
      const results = await getDrillDown(filter);

      expect(results.filter.severity).toEqual(['critical']);
    });

    it('should support status filter', async () => {
      const filter: FilterCriteria = { status: ['open', 'in_progress'] };
      const results = await getDrillDown(filter);

      expect(results.filter.status).toEqual(['open', 'in_progress']);
    });

    it('should support date range filter', async () => {
      const filter: FilterCriteria = {
        dateRange: { start: '2026-06-01', end: '2026-06-05' },
      };
      const results = await getDrillDown(filter);

      expect(results.filter.dateRange).toEqual(filter.dateRange);
    });

    it('should support team filter', async () => {
      const filter: FilterCriteria = { team: ['security-team'] };
      const results = await getDrillDown(filter);

      expect(results.filter.team).toEqual(['security-team']);
    });
  });
});
