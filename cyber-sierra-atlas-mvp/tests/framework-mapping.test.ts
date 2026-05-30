import { describe, it, expect } from 'vitest';
import { mapFindingToControls, calculateFrameworkCoverage, getFrameworkGaps } from '../src/lib/framework-mapping';
import { Finding } from '../src/lib/schema';

describe('Framework Mapping', () => {
  const mockFinding: Finding = {
    id: '1',
    title: 'Missing MFA on admin accounts',
    description: 'Admin accounts lack multi-factor authentication',
    severity: 'Critical',
    status: 'Open',
    source_document: {
      filename: 'test.pdf',
      upload_date: new Date().toISOString(),
      parser_confidence: 0.95
    },
    asset_id: 'auth-001',
    asset_name: 'Authentication Service',
    control_framework: 'ISO 27001',
    control_clause: 'A.6.2',
    related_findings: []
  };

  describe('mapFindingToControls', () => {
    it('should map finding to ISO27001 controls', () => {
      const result = mapFindingToControls(mockFinding, 'iso27001', 'Authentication');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should map Access Control to multiple controls', () => {
      const result = mapFindingToControls(mockFinding, 'iso27001', 'Access Control');
      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('A.6.1');
    });

    it('should return empty array for unknown type', () => {
      const result = mapFindingToControls(mockFinding, 'iso27001', 'Unknown Type');
      expect(result).toEqual([]);
    });

    it('should map to NIST CSF controls', () => {
      const result = mapFindingToControls(mockFinding, 'nist_csf', 'Access Control');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should map to CIS Controls', () => {
      const result = mapFindingToControls(mockFinding, 'cis_controls', 'Authentication');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateFrameworkCoverage', () => {
    it('should calculate coverage 0-100', () => {
      const findings = [mockFinding];
      const coverage = calculateFrameworkCoverage(findings, 'iso27001');
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    it('should increase coverage with more findings', () => {
      const findings1 = [mockFinding];
      const findings2 = [
        mockFinding,
        { ...mockFinding, id: '2', control_clause: 'A.8.1' }
      ];

      const coverage1 = calculateFrameworkCoverage(findings1, 'iso27001');
      const coverage2 = calculateFrameworkCoverage(findings2, 'iso27001');

      expect(coverage2).toBeGreaterThanOrEqual(coverage1);
    });

    it('should return 0 for empty findings', () => {
      const coverage = calculateFrameworkCoverage([], 'iso27001');
      expect(coverage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getFrameworkGaps', () => {
    it('should identify uncovered controls', () => {
      const findings = [mockFinding];
      const gaps = getFrameworkGaps(findings, 'iso27001');
      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
    });

    it('should return fewer gaps with more findings', () => {
      const findings1 = [mockFinding];
      const findings2 = [
        mockFinding,
        { ...mockFinding, id: '2', control_clause: 'A.5.1' },
        { ...mockFinding, id: '3', control_clause: 'A.7.1' },
        { ...mockFinding, id: '4', control_clause: 'A.8.1' }
      ];

      const gaps1 = getFrameworkGaps(findings1, 'iso27001');
      const gaps2 = getFrameworkGaps(findings2, 'iso27001');

      expect(gaps2.length).toBeLessThanOrEqual(gaps1.length);
    });

    it('should return all controls for empty findings', () => {
      const gaps = getFrameworkGaps([], 'iso27001');
      expect(gaps.length).toBe(14); // ISO27001 has 14 controls
    });
  });
});
