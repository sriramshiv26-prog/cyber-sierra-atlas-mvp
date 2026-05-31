import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildReportSummary, generatePDFReport, generateExcelReport } from '../../src/lib/report-generator';
import { Store, Finding } from '../../src/lib/schema';

describe('Report Generator', () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const mockFinding = (overrides?: Partial<Finding>): Finding => ({
    id: 'F1',
    title: 'Test Finding',
    description: 'Test Description',
    severity: 'Critical',
    status: 'Open',
    source_document: {
      filename: 'test.pdf',
      upload_date: new Date().toISOString(),
      parser_confidence: 0.95,
    },
    asset_id: 'A1',
    asset_name: 'Test Asset',
    control_framework: 'ISO 27001',
    control_clause: 'A.5.1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related_findings: [],
    ...overrides,
  });

  const mockStore = (findings: Finding[] = []): Store => ({
    findings,
    assets: [],
    controls: [],
    lastSaved: new Date().toISOString(),
  });

  describe('buildReportSummary', () => {
    it('should return empty summary for empty findings array', () => {
      const summary = buildReportSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.open).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.overdue).toBe(0);
    });

    it('should count total findings', () => {
      const findings = [mockFinding(), mockFinding({ id: 'F2' })];
      const summary = buildReportSummary(findings);

      expect(summary.total).toBe(2);
    });

    it('should count findings by severity', () => {
      const findings = [
        mockFinding({ severity: 'Critical' }),
        mockFinding({ id: 'F2', severity: 'High' }),
        mockFinding({ id: 'F3', severity: 'Medium' }),
        mockFinding({ id: 'F4', severity: 'Low' }),
        mockFinding({ id: 'F5', severity: 'Informational' }),
      ];
      const summary = buildReportSummary(findings);

      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(1);
      expect(summary.low).toBe(1);
      expect(summary.informational).toBe(1);
    });

    it('should count findings by status', () => {
      const findings = [
        mockFinding({ status: 'Open' }),
        mockFinding({ id: 'F2', status: 'In Progress' }),
        mockFinding({ id: 'F3', status: 'Closed' }),
        mockFinding({ id: 'F4', status: 'Resolved' }),
      ];
      const summary = buildReportSummary(findings);

      expect(summary.open).toBe(1);
      expect(summary.inProgress).toBe(1);
      expect(summary.closed).toBe(2);
    });

    it('should count overdue findings', () => {
      const findings = [
        mockFinding({ due_date: yesterday.toISOString(), status: 'Open' }),
        mockFinding({ id: 'F2', due_date: tomorrow.toISOString(), status: 'Open' }),
        mockFinding({ id: 'F3', due_date: yesterday.toISOString(), status: 'Closed' }), // Not counted, already closed
      ];
      const summary = buildReportSummary(findings);

      expect(summary.overdue).toBe(1);
    });

    it('should count unassigned findings', () => {
      const findings = [
        mockFinding({ owner: 'John' }),
        mockFinding({ id: 'F2', owner: undefined }),
        mockFinding({ id: 'F3', owner: 'Jane' }),
        mockFinding({ id: 'F4', owner: undefined }),
      ];
      const summary = buildReportSummary(findings);

      expect(summary.unassigned).toBe(2);
    });

    it('should include generated timestamp', () => {
      const summary = buildReportSummary([]);

      expect(summary.generatedAt).toBeDefined();
      expect(new Date(summary.generatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('generatePDFReport', () => {
    it('should be defined and callable', async () => {
      const store = mockStore([mockFinding()]);

      // Just verify the function exists and has proper signature
      expect(typeof generatePDFReport).toBe('function');
      // generatePDFReport has 1 required param (store) and 1 optional (title)
      expect(generatePDFReport.length).toBe(1);
    });
  });

  describe('generateExcelReport', () => {
    it('should be defined and callable', async () => {
      const store = mockStore([mockFinding()]);

      // Just verify the function exists and has proper signature
      expect(typeof generateExcelReport).toBe('function');
      expect(generateExcelReport.length).toBe(1); // store parameter
    });
  });
});
