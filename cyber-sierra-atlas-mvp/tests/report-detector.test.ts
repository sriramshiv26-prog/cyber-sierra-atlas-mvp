import { describe, it, expect } from 'vitest';
import { detectReportType, detectByFileName } from '../src/lib/report-detector';

describe('Report Type Detection', () => {
  describe('Content-based detection', () => {
    it('should detect Pen Test from content', () => {
      const content = 'Penetration Test Report CVSS 8.5 vulnerability SQL injection attack surface';
      expect(detectReportType(content)).toBe('pen-test');
    });

    it('should detect External Audit from content', () => {
      const content = 'External Audit SOC 2 Type II Compliance Status Compliant ISO 27001 auditor assessment';
      expect(detectReportType(content)).toBe('external-audit');
    });

    it('should detect Risk Assessment from content', () => {
      const content = 'Risk Assessment Report Risk Level High Risk Score 78 threat analysis impact';
      expect(detectReportType(content)).toBe('risk-assessment');
    });

    it('should detect Vulnerability Scan from content', () => {
      const content = 'Vulnerability Scan Results Nessus Qualys CVE-2024 scanner findings';
      expect(detectReportType(content)).toBe('vulnerability-scan');
    });

    it('should detect Internal Audit from content', () => {
      const content = 'Internal Audit Report self assessment internal control control design';
      expect(detectReportType(content)).toBe('internal-audit');
    });

    it('should detect Incident from content', () => {
      const content = 'Incident Report Security Incident Breach Postmortem analysis findings';
      expect(detectReportType(content)).toBe('incident');
    });

    it('should return null for unrecognized content', () => {
      const content = 'Random document with no audit keywords';
      expect(detectReportType(content)).toBeNull();
    });
  });

  describe('Filename-based detection', () => {
    it('should detect Pen Test from filename', () => {
      expect(detectByFileName('Q2_Pentest_2026.pdf')).toBe('pen-test');
      expect(detectByFileName('pen-test-report.xlsx')).toBe('pen-test');
    });

    it('should detect External Audit from filename', () => {
      expect(detectByFileName('SOC2_External_Audit.xlsx')).toBe('external-audit');
      expect(detectByFileName('ISO27001-External-Audit.pdf')).toBe('external-audit');
    });

    it('should detect Risk Assessment from filename', () => {
      expect(detectByFileName('Risk_Assessment_2026.pdf')).toBe('risk-assessment');
    });

    it('should detect Vulnerability Scan from filename', () => {
      expect(detectByFileName('Vulnerability_Scan_Report.xlsx')).toBe('vulnerability-scan');
      expect(detectByFileName('nessus-scan-results.pdf')).toBe('vulnerability-scan');
    });

    it('should detect Internal Audit from filename', () => {
      expect(detectByFileName('Internal_Audit_Report.pdf')).toBe('internal-audit');
    });

    it('should detect Incident from filename', () => {
      expect(detectByFileName('Incident_Report_2026.pdf')).toBe('incident');
    });

    it('should return null for unknown filename patterns', () => {
      expect(detectByFileName('general-report.pdf')).toBeNull();
      expect(detectByFileName('document.docx')).toBeNull();
    });
  });

  describe('Type detection confidence', () => {
    it('should prioritize content with multiple matching keywords', () => {
      const content = 'Penetration Test Report with CVSS scores and vulnerability analysis';
      const detected = detectReportType(content);
      expect(detected).toBe('pen-test');
    });

    it('should handle mixed keywords gracefully', () => {
      const content = 'Risk assessment report with risk level evaluation conducted by external auditor for compliance';
      // Should detect one of the two types
      const detected = detectReportType(content);
      expect(detected !== null && ['risk-assessment', 'external-audit'].includes(detected)).toBe(true);
    });
  });
});
