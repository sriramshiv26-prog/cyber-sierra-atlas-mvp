import { describe, it, expect } from 'vitest';
import { isAuditReport, getReportTypeLabel, AUDIT_REPORT_TYPES, ManualFindingInput } from '../src/lib/audit-types';
import { Finding } from '../src/lib/schema';

describe('Audit Types', () => {
  it('should support all 12 audit report types', () => {
    expect(AUDIT_REPORT_TYPES.length).toBe(12);
  });

  it('should include required audit types', () => {
    const requiredTypes = [
      'non-conformity', 'pen-test', 'third-party-assessment',
      'external-audit', 'risk-assessment', 'vulnerability-scan',
      'internal-audit', 'regulatory', 'tabletop-ir',
      'incident', 'rcsa', 'operational-issue'
    ];
    requiredTypes.forEach(type => {
      expect(AUDIT_REPORT_TYPES).toContain(type);
    });
  });

  it('should detect audit report by type name', () => {
    expect(isAuditReport('pen-test')).toBe(true);
    expect(isAuditReport('external-audit')).toBe(true);
    expect(isAuditReport('vulnerability')).toBe(false);
  });

  it('should map report type to label', () => {
    expect(getReportTypeLabel('pen-test')).toBe('Penetration Test');
    expect(getReportTypeLabel('external-audit')).toBe('External Audit');
    expect(getReportTypeLabel('non-conformity')).toBe('Non-Conformity');
    expect(getReportTypeLabel('rcsa')).toBe('RCSA');
  });

  it('should have label for every report type', () => {
    AUDIT_REPORT_TYPES.forEach(type => {
      expect(getReportTypeLabel(type)).toBeTruthy();
      expect(typeof getReportTypeLabel(type)).toBe('string');
    });
  });

  it('should create Finding with audit report type', () => {
    const finding: Finding = {
      id: 'audit-001',
      title: 'SQL Injection',
      description: 'Possible SQL injection vulnerability',
      severity: 'Critical',
      status: 'Open',
      source_document: {
        filename: 'pen-test-q2-2026.pdf',
        upload_date: new Date().toISOString(),
        parser_confidence: 0.95
      },
      asset_id: 'api-001',
      asset_name: 'API Server',
      control_framework: 'NIST CSF',
      control_clause: 'PR.DS.02',
      audit_report_type: 'pen-test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      related_findings: []
    };
    expect(finding.audit_report_type).toBe('pen-test');
    expect(isAuditReport(finding.audit_report_type)).toBe(true);
  });

  it('should validate manual finding input', () => {
    const manualFinding: ManualFindingInput = {
      title: 'Weak Password Policy',
      description: 'Users can set weak passwords',
      severity: 'High',
      status: 'Open',
      assetName: 'Active Directory',
      assetType: 'Infrastructure',
      auditReportType: 'internal-audit'
    };
    expect(manualFinding.auditReportType).toBe('internal-audit');
    expect(isAuditReport(manualFinding.auditReportType)).toBe(true);
  });
});
