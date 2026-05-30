import { describe, it, expect } from 'vitest';
import { validateManualEntry } from '../src/lib/audit-validation';

describe('Manual Entry Validation', () => {
  describe('Required fields', () => {
    it('should require title', () => {
      const input = {
        title: '',
        description: 'Test description',
        severity: 'High',
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should require description', () => {
      const input = {
        title: 'SQL Injection',
        description: '',
        severity: 'High',
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should require severity', () => {
      const input = {
        title: 'SQL Injection',
        description: 'Test description',
        severity: undefined,
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Severity is required');
    });

    it('should require audit report type', () => {
      const input = {
        title: 'SQL Injection',
        description: 'Test description',
        severity: 'High',
        auditReportType: undefined
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report type is required');
    });
  });

  describe('Valid entries', () => {
    it('should accept minimal valid entry', () => {
      const input = {
        title: 'SQL Injection',
        description: 'Found SQL injection in login',
        severity: 'Critical',
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should accept valid entry with optional fields', () => {
      const input = {
        title: 'Weak Password Policy',
        description: 'Users can set weak passwords',
        severity: 'High',
        auditReportType: 'internal-audit',
        status: 'Open',
        assetName: 'Active Directory',
        assetType: 'Infrastructure',
        dueDate: '2026-06-30',
        remediation: 'Enforce strong password requirements'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(true);
    });

    it('should accept all severity levels', () => {
      const severities = ['Critical', 'High', 'Medium', 'Low'];
      severities.forEach(severity => {
        const input = {
          title: 'Test Finding',
          description: 'Test description',
          severity,
          auditReportType: 'risk-assessment'
        };
        const result = validateManualEntry(input);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Date validation', () => {
    it('should validate ISO date format', () => {
      const input = {
        title: 'Finding',
        description: 'Test',
        severity: 'High',
        auditReportType: 'incident',
        dueDate: '2026-06-30'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid date format', () => {
      const input = {
        title: 'Finding',
        description: 'Test',
        severity: 'High',
        auditReportType: 'incident',
        dueDate: 'invalid-date'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('date'))).toBe(true);
    });

    it('should reject malformed dates', () => {
      const invalidDates = [
        '2026-13-01', // invalid month
        '2026-06-31', // invalid day
        '06-30-2026',  // wrong format
        '2026/06/30'   // wrong separator
      ];
      invalidDates.forEach(date => {
        const input = {
          title: 'Finding',
          description: 'Test',
          severity: 'High',
          auditReportType: 'incident',
          dueDate: date
        };
        const result = validateManualEntry(input);
        expect(result.valid).toBe(false);
      });
    });

    it('should skip date validation if not provided', () => {
      const input = {
        title: 'Finding',
        description: 'Test',
        severity: 'High',
        auditReportType: 'incident'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(true);
    });
  });

  describe('Field length validation', () => {
    it('should reject empty title', () => {
      const input = {
        title: '   ',
        description: 'Valid description',
        severity: 'High',
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
    });

    it('should reject empty description', () => {
      const input = {
        title: 'Valid Title',
        description: '   ',
        severity: 'High',
        auditReportType: 'pen-test'
      };
      const result = validateManualEntry(input);
      expect(result.valid).toBe(false);
    });
  });

  describe('Status validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['Open', 'In Progress', 'Resolved'];
      validStatuses.forEach(status => {
        const input = {
          title: 'Finding',
          description: 'Test',
          severity: 'High',
          auditReportType: 'incident',
          status
        };
        const result = validateManualEntry(input);
        // Status is optional, so it should be valid
        expect(result.valid).toBe(true);
      });
    });
  });
});
