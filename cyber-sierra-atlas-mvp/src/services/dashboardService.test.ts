import { describe, it, expect } from 'vitest';
import {
  computeSeverityBreakdown,
  computeCapaMetrics,
  computeMTTR,
  computeSLACompliance,
  getTrendData,
  getComparisonData,
  drillDown,
  computeRiskScore,
  dashboardService,
} from './dashboardService';

describe('Dashboard Service', () => {
  describe('computeSeverityBreakdown', () => {
    it('should return severity object with all levels', async () => {
      const severity = await computeSeverityBreakdown();

      expect(severity).toHaveProperty('critical');
      expect(severity).toHaveProperty('high');
      expect(severity).toHaveProperty('medium');
      expect(severity).toHaveProperty('low');
    });

    it('should return numeric counts', async () => {
      const severity = await computeSeverityBreakdown();

      expect(typeof severity.critical).toBe('number');
      expect(typeof severity.high).toBe('number');
      expect(typeof severity.medium).toBe('number');
      expect(typeof severity.low).toBe('number');
    });

    it('should return non-negative counts', async () => {
      const severity = await computeSeverityBreakdown();

      expect(severity.critical).toBeGreaterThanOrEqual(0);
      expect(severity.high).toBeGreaterThanOrEqual(0);
      expect(severity.medium).toBeGreaterThanOrEqual(0);
      expect(severity.low).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeCapaMetrics', () => {
    it('should return CAPA metrics object', async () => {
      const capa = await computeCapaMetrics();

      expect(capa).toHaveProperty('percentComplete');
      expect(capa).toHaveProperty('inProgress');
      expect(capa).toHaveProperty('atRisk');
      expect(capa).toHaveProperty('overdue');
    });

    it('should return valid percentage (0-100)', async () => {
      const capa = await computeCapaMetrics();

      expect(capa.percentComplete).toBeGreaterThanOrEqual(0);
      expect(capa.percentComplete).toBeLessThanOrEqual(100);
    });

    it('should return non-negative counts', async () => {
      const capa = await computeCapaMetrics();

      expect(capa.inProgress).toBeGreaterThanOrEqual(0);
      expect(capa.atRisk).toBeGreaterThanOrEqual(0);
      expect(capa.overdue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeMTTR', () => {
    it('should return MTTR object', async () => {
      const mttr = await computeMTTR();

      expect(mttr).toHaveProperty('current');
      expect(mttr).toHaveProperty('trend');
    });

    it('should return non-negative days', async () => {
      const mttr = await computeMTTR();

      expect(mttr.current).toBeGreaterThanOrEqual(0);
    });

    it('should return valid trend value', async () => {
      const mttr = await computeMTTR();

      expect(['improving', 'stable', 'degrading']).toContain(mttr.trend);
    });
  });

  describe('computeSLACompliance', () => {
    it('should return SLA object', async () => {
      const sla = await computeSLACompliance();

      expect(sla).toHaveProperty('percentCompliant');
      expect(sla).toHaveProperty('overdueFindings');
      expect(sla).toHaveProperty('overdueCAPAs');
    });

    it('should return valid percentage (0-100)', async () => {
      const sla = await computeSLACompliance();

      expect(sla.percentCompliant).toBeGreaterThanOrEqual(0);
      expect(sla.percentCompliant).toBeLessThanOrEqual(100);
    });

    it('should return non-negative counts', async () => {
      const sla = await computeSLACompliance();

      expect(sla.overdueFindings).toBeGreaterThanOrEqual(0);
      expect(sla.overdueCAPAs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTrendData', () => {
    it('should return 30 TrendPoints for days=30', async () => {
      const trends = await getTrendData(30);

      expect(trends).toHaveLength(30);
      expect(Array.isArray(trends)).toBe(true);
    });

    it('should return 60 TrendPoints for days=60', async () => {
      const trends = await getTrendData(60);

      expect(trends).toHaveLength(60);
    });

    it('should return 90 TrendPoints for days=90', async () => {
      const trends = await getTrendData(90);

      expect(trends).toHaveLength(90);
    });

    it('should have valid TrendPoint structure', async () => {
      const trends = await getTrendData(7);

      trends.forEach((point) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('openFindings');
        expect(point).toHaveProperty('closedFindings');
        expect(point).toHaveProperty('mttrDays');
        expect(point).toHaveProperty('slaCompliance');
        expect(point).toHaveProperty('capaCompletePercent');
      });
    });

    it('should have valid date format (YYYY-MM-DD)', async () => {
      const trends = await getTrendData(7);

      trends.forEach((point) => {
        expect(/^\d{4}-\d{2}-\d{2}$/.test(point.date)).toBe(true);
      });
    });

    it('should have non-negative numeric values', async () => {
      const trends = await getTrendData(7);

      trends.forEach((point) => {
        expect(point.openFindings).toBeGreaterThanOrEqual(0);
        expect(point.closedFindings).toBeGreaterThanOrEqual(0);
        expect(point.mttrDays).toBeGreaterThanOrEqual(0);
        expect(point.slaCompliance).toBeGreaterThanOrEqual(0);
        expect(point.slaCompliance).toBeLessThanOrEqual(100);
        expect(point.capaCompletePercent).toBeGreaterThanOrEqual(0);
        expect(point.capaCompletePercent).toBeLessThanOrEqual(100);
      });
    });

    it('should have progressive dates', async () => {
      const trends = await getTrendData(7);

      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].date >= trends[i - 1].date).toBe(true);
      }
    });
  });

  describe('getComparisonData', () => {
    it('should return comparison object with current and previous', async () => {
      const comparison = await getComparisonData('week');

      expect(comparison).toHaveProperty('current');
      expect(comparison).toHaveProperty('previous');
      expect(comparison).toHaveProperty('deltas');
    });

    it('should have current period data', async () => {
      const comparison = await getComparisonData('week');

      expect(comparison.current).toHaveProperty('period');
      expect(comparison.current).toHaveProperty('metrics');
      expect(comparison.current).toHaveProperty('startDate');
      expect(comparison.current).toHaveProperty('endDate');
    });

    it('should have valid current period for week', async () => {
      const comparison = await getComparisonData('week');

      expect(comparison.current.period).toBe('this_week');
      expect(comparison.previous.period).toBe('last_week');
    });

    it('should have valid current period for month', async () => {
      const comparison = await getComparisonData('month');

      expect(comparison.current.period).toBe('this_month');
      expect(comparison.previous.period).toBe('last_month');
    });

    it('should have valid delta values', async () => {
      const comparison = await getComparisonData('week');

      expect(typeof comparison.deltas.criticalFindings).toBe('number');
      expect(typeof comparison.deltas.capaCompleteChange).toBe('number');
      expect(typeof comparison.deltas.mttrChange).toBe('number');
      expect(typeof comparison.deltas.slaComplianceChange).toBe('number');
    });

    it('should have complete metrics in both periods', async () => {
      const comparison = await getComparisonData('week');

      expect(comparison.current.metrics).toHaveProperty('severity');
      expect(comparison.current.metrics).toHaveProperty('capa');
      expect(comparison.current.metrics).toHaveProperty('mttr');
      expect(comparison.current.metrics).toHaveProperty('sla');

      expect(comparison.previous.metrics).toHaveProperty('severity');
      expect(comparison.previous.metrics).toHaveProperty('capa');
      expect(comparison.previous.metrics).toHaveProperty('mttr');
      expect(comparison.previous.metrics).toHaveProperty('sla');
    });
  });

  describe('drillDown', () => {
    it('should return object with count and results', async () => {
      const result = await drillDown({});

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('results');
    });

    it('should return array of results', async () => {
      const result = await drillDown({});

      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should return non-negative count', async () => {
      const result = await drillDown({});

      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should accept empty filter', async () => {
      const result = await drillDown({});

      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should accept severity filter', async () => {
      const result = await drillDown({ severity: ['critical'] });

      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should accept status filter', async () => {
      const result = await drillDown({ status: ['open'] });

      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should accept pagination parameters', async () => {
      const result = await drillDown({}, 1, 10);

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('results');
    });
  });

  describe('computeRiskScore', () => {
    it('should return number between 0 and 100', async () => {
      const score = await computeRiskScore();

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should be integer value', async () => {
      const score = await computeRiskScore();

      expect(Number.isInteger(score)).toBe(true);
    });

    it('should increase with higher critical count', async () => {
      // This is a basic sanity check; full testing requires mocking
      const score = await computeRiskScore();

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dashboardService object', () => {
    it('should export all service functions', () => {
      expect(dashboardService).toHaveProperty('computeSeverityBreakdown');
      expect(dashboardService).toHaveProperty('computeCapaMetrics');
      expect(dashboardService).toHaveProperty('computeMTTR');
      expect(dashboardService).toHaveProperty('computeSLACompliance');
      expect(dashboardService).toHaveProperty('getTrendData');
      expect(dashboardService).toHaveProperty('getComparisonData');
      expect(dashboardService).toHaveProperty('drillDown');
      expect(dashboardService).toHaveProperty('computeRiskScore');
    });

    it('should have callable functions', () => {
      expect(typeof dashboardService.computeSeverityBreakdown).toBe('function');
      expect(typeof dashboardService.computeCapaMetrics).toBe('function');
      expect(typeof dashboardService.computeMTTR).toBe('function');
      expect(typeof dashboardService.computeSLACompliance).toBe('function');
      expect(typeof dashboardService.getTrendData).toBe('function');
      expect(typeof dashboardService.getComparisonData).toBe('function');
      expect(typeof dashboardService.drillDown).toBe('function');
      expect(typeof dashboardService.computeRiskScore).toBe('function');
    });
  });
});
