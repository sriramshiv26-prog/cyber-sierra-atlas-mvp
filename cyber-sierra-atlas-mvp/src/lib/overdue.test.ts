import { Finding } from './schema';
import {
  calculateOverdueStatus,
  getOverdueFindings,
  calculateOverdueMetrics,
  getOverdueLabel,
  getOverdueRiskMultiplier,
} from './overdue';

describe('Overdue Tracking (Phase 2B)', () => {
  const baseFinding = (overrides: Partial<Finding> = {}): Finding => ({
    id: '1',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
    title: 'Test Finding',
    description: 'Test',
    severity: 'High',
    status: 'Open',
    asset_id: 'asset-1',
    asset_name: 'Asset 1',
    source_document: {
      filename: 'test.pdf',
      upload_date: '2026-05-28T10:00:00Z',
      parser_confidence: 0.95,
    },
    control_framework: 'NIST CSF',
    control_clause: 'ID.1',
    related_findings: [],
    ...overrides,
  });

  describe('calculateOverdueStatus - Status Detection', () => {
    it('should detect findings past due date as overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const f = baseFinding({ due_date: yesterday.toISOString() });
      const status = calculateOverdueStatus(f);

      expect(status.isOverdue).toBe(true);
      expect(status.daysOverdue).toBeGreaterThan(0);
    });

    it('should NOT mark closed findings as overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const f = baseFinding({
        due_date: yesterday.toISOString(),
        status: 'Closed'
      });
      const status = calculateOverdueStatus(f);

      expect(status.isOverdue).toBe(false);
    });

    it('should NOT mark resolved findings as overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const f = baseFinding({
        due_date: yesterday.toISOString(),
        status: 'Resolved'
      });
      const status = calculateOverdueStatus(f);

      expect(status.isOverdue).toBe(false);
    });

    it('should detect wildly overdue (>30 days)', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const f = baseFinding({ due_date: thirtyOneDaysAgo.toISOString() });
      const status = calculateOverdueStatus(f);

      expect(status.isWildlyOverdue).toBe(true);
    });

    it('should NOT mark findings without due date as overdue', () => {
      const f = baseFinding({ due_date: undefined });
      const status = calculateOverdueStatus(f);

      expect(status.isOverdue).toBe(false);
      expect(status.daysOverdue).toBe(0);
    });

    it('should calculate days until due for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);

      const f = baseFinding({ due_date: tomorrow.toISOString() });
      const status = calculateOverdueStatus(f);

      expect(status.isOverdue).toBe(false);
      expect(status.daysUntilDue).toBeGreaterThan(0);
    });
  });

  describe('getOverdueFindings - Filtering', () => {
    it('should filter only overdue findings', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const f1 = baseFinding({ id: '1', due_date: yesterday.toISOString() });
      const f2 = baseFinding({ id: '2', due_date: tomorrow.toISOString() });
      const f3 = baseFinding({ id: '3', due_date: undefined });

      const overdue = getOverdueFindings([f1, f2, f3]);

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });
  });

  describe('calculateOverdueMetrics - Dashboard KPIs', () => {
    it('should return 0 count when no overdue findings', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const f = baseFinding({ due_date: tomorrow.toISOString() });
      const metrics = calculateOverdueMetrics([f]);

      expect(metrics.count).toBe(0);
      expect(metrics.mostOverdueId).toBeUndefined();
    });

    it('should identify most overdue finding', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const f1 = baseFinding({ id: '1', due_date: tenDaysAgo.toISOString() });
      const f2 = baseFinding({ id: '2', due_date: twentyDaysAgo.toISOString() });

      const metrics = calculateOverdueMetrics([f1, f2]);

      expect(metrics.count).toBe(2);
      expect(metrics.mostOverdueId).toBe('2'); // 20 days is more overdue
    });
  });

  describe('getOverdueLabel - User Display', () => {
    it('should show "No due date" for findings without due date', () => {
      const f = baseFinding({ due_date: undefined });
      const label = getOverdueLabel(f);

      expect(label).toBe('No due date');
    });

    it('should show "Due in X days" for upcoming due dates', () => {
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

      const f = baseFinding({ due_date: fiveDaysLater.toISOString() });
      const label = getOverdueLabel(f);

      expect(label).toContain('Due in');
      expect(label).toContain('day');
    });

    it('should show "Overdue X days" for past due dates', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const f = baseFinding({ due_date: fiveDaysAgo.toISOString() });
      const label = getOverdueLabel(f);

      expect(label).toContain('Overdue');
      expect(label).toContain('5');
    });
  });

  describe('getOverdueRiskMultiplier - Risk Adjustment', () => {
    it('should return 1.0 (no penalty) for non-overdue findings', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const f = baseFinding({ due_date: tomorrow.toISOString() });
      const multiplier = getOverdueRiskMultiplier(f);

      expect(multiplier).toBe(1.0);
    });

    it('should return 1.1 (+10%) for recent overdue findings', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const f = baseFinding({ due_date: twoDaysAgo.toISOString() });
      const multiplier = getOverdueRiskMultiplier(f);

      expect(multiplier).toBe(1.1);
    });

    it('should return 1.2 (+20%) for wildly overdue findings (>30 days)', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const f = baseFinding({ due_date: thirtyOneDaysAgo.toISOString() });
      const multiplier = getOverdueRiskMultiplier(f);

      expect(multiplier).toBe(1.2);
    });

    it('should return 1.0 for closed overdue findings (no penalty after closed)', () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const f = baseFinding({
        due_date: thirtyOneDaysAgo.toISOString(),
        status: 'Closed'
      });
      const multiplier = getOverdueRiskMultiplier(f);

      expect(multiplier).toBe(1.0);
    });
  });
});
