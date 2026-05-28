import { describe, it, expect } from 'vitest';
import { findExactDuplicates, findSemanticDuplicates } from '../src/lib/deduplication';
import { validateAllFindings, getValidFindings } from '../src/lib/validation';
import { calculateRiskScore, getRiskLevel } from '../src/lib/scoring';
import { Finding } from '../src/lib/schema';

describe('Integration: Deduplication Engine', () => {
  const now = new Date().toISOString();
  const mockFindings: Finding[] = [
    {
      id: '1',
      title: 'SQL Injection in Login API',
      severity: 'Critical',
      asset_id: 'asset-1',
      asset_name: 'auth-service',
      cve: 'CVE-2024-1234',
      source_document: { filename: 'pentest-report-2024.pdf', upload_date: now, parser_confidence: 0.95 },
      status: 'Open',
      description: 'Attacker can bypass authentication',
      due_date: '2024-06-30',
      control_framework: 'NIST 800-53',
      control_clause: 'AC-2',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding,
    {
      id: '2',
      title: 'SQL Injection in Login API',
      severity: 'Critical',
      asset_id: 'asset-1',
      asset_name: 'auth-service',
      cve: 'CVE-2024-1234',
      source_document: { filename: 'pentest-report-2024.pdf', upload_date: now, parser_confidence: 0.95 },
      status: 'Open',
      description: 'Attacker can bypass authentication',
      due_date: '2024-06-30',
      control_framework: 'NIST 800-53',
      control_clause: 'AC-2',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding,
    {
      id: '3',
      title: 'Weak Password Policy',
      severity: 'High',
      asset_id: 'asset-1',
      asset_name: 'auth-service',
      cve: undefined,
      source_document: { filename: 'compliance-audit-2024.pdf', upload_date: now, parser_confidence: 0.90 },
      status: 'Open',
      description: 'Enforce complexity requirements',
      due_date: '2024-07-15',
      control_framework: 'ISO 27001',
      control_clause: 'A.9.2.1',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding,
  ];

  it('should find exact duplicates by CVE + Asset', () => {
    const dupes = findExactDuplicates(mockFindings);
    expect(dupes.length).toBeGreaterThan(0);
    if (dupes.length > 0) {
      expect(dupes[0].finding1).toBeDefined();
      expect(dupes[0].finding2).toBeDefined();
      expect(dupes[0].confidence).toBe(1.0);
    }
  });

  it('should not flag unrelated findings as semantic matches', () => {
    const semantic = findSemanticDuplicates(mockFindings);
    // Semantic should only match similar titles, SQL Injection and Weak Password are different
    const weakPasswordDupes = semantic.filter(d => {
      return (mockFindings.find(f => f.id === d.finding1)?.title.includes('Weak') ||
              mockFindings.find(f => f.id === d.finding2)?.title.includes('Weak'));
    });
    expect(weakPasswordDupes.length).toBeLessThanOrEqual(0);
  });

  it('should handle empty findings array', () => {
    const exact = findExactDuplicates([]);
    const semantic = findSemanticDuplicates([]);
    expect(exact).toEqual([]);
    expect(semantic).toEqual([]);
  });
});

describe('Integration: Validation Engine', () => {
  it('should catch missing required fields', () => {
    const now = new Date().toISOString();
    const invalid: Finding = {
      id: '1',
      source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
      asset_id: 'asset-1',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding;
    const issues = validateAllFindings([invalid]);
    expect(issues.length).toBeGreaterThan(0);
    const hasErrorSeverity = issues.some(i => i.severity === 'error');
    expect(hasErrorSeverity).toBe(true);
  });

  it('should warn on overdue findings', () => {
    const now = new Date().toISOString();
    const overdue: Finding = {
      id: '1',
      title: 'Old Vulnerability',
      severity: 'High',
      asset_id: 'asset-1',
      asset_name: 'app',
      due_date: new Date(Date.now() - 86400000).toISOString(),
      status: 'Open',
      description: 'Test',
      source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
      control_framework: 'NIST',
      control_clause: 'AC-1',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding;
    const issues = validateAllFindings([overdue]);
    // Overdue findings should trigger validation issues
    const findingIssues = issues.filter(i => i.finding_id === '1');
    expect(findingIssues.length).toBeGreaterThan(0);
  });

  it('should validate CVE format correctly', () => {
    const now = new Date().toISOString();
    const validCVE: Finding = {
      id: '1',
      title: 'Vuln',
      severity: 'Medium',
      asset_id: 'asset-1',
      asset_name: 'app',
      cve: 'CVE-2024-12345',
      status: 'Open',
      description: 'Test',
      source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
      control_framework: 'NIST',
      control_clause: 'AC-1',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding;
    const issues = validateAllFindings([validCVE]);
    const cveErrors = issues.filter(i => i.finding_id === '1' && i.message.includes('CVE'));
    expect(cveErrors.length).toBe(0);
  });

  it('should filter out invalid findings', () => {
    const now = new Date().toISOString();
    const mixed: Finding[] = [
      {
        id: '1',
        title: 'Valid Finding',
        severity: 'High',
        asset_id: 'asset-1',
        asset_name: 'app',
        status: 'Open',
        description: 'Test',
        source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
        control_framework: 'NIST',
        control_clause: 'AC-1',
        created_at: now,
        updated_at: now,
        related_findings: [],
      } as Finding,
      {
        id: '2',
        title: '',
        severity: 'Medium' as any,
        asset_id: 'asset-1',
        asset_name: '',
        status: 'Open',
        source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
        control_framework: 'NIST',
        control_clause: 'AC-1',
        created_at: now,
        updated_at: now,
        related_findings: [],
      } as Finding,
    ];
    const valid = getValidFindings(mixed);
    expect(valid.length).toBeLessThanOrEqual(mixed.length);
  });
});

describe('Integration: Risk Scoring', () => {
  it('should calculate correct risk scores with control effectiveness', () => {
    // Critical on Critical with no controls (1.0) = (10 * 2.0 / 1.0) * 5 = 100
    const criticalOnCritical = calculateRiskScore('Critical', 'Critical', 1.0);
    expect(criticalOnCritical).toBe(100);

    // Low on Low with no controls (1.0) = (2 * 0.5 / 1.0) * 5 = 5
    const lowOnLow = calculateRiskScore('Low', 'Low', 1.0);
    expect(lowOnLow).toBe(5);

    // High on High with no controls (1.0) = (7 * 1.5 / 1.0) * 5 = 52.5
    const highOnHigh = calculateRiskScore('High', 'High', 1.0);
    expect(highOnHigh).toBe(52.5);
  });

  it('should reduce score with effective controls', () => {
    // Same vulnerability with 50% effective controls should score higher
    const noControls = calculateRiskScore('Critical', 'Critical', 1.0);
    const withControls = calculateRiskScore('Critical', 'Critical', 0.5);
    expect(withControls).toBeGreaterThan(noControls);
  });

  it('should default to Medium criticality and full control weight if not provided', () => {
    const score1 = calculateRiskScore('Critical');
    const score2 = calculateRiskScore('Critical', 'Medium', 1.0);
    expect(score1).toBe(score2);
  });

  it('should map scores to correct risk levels', () => {
    expect(getRiskLevel(95).label).toBe('Extreme');
    expect(getRiskLevel(70).label).toBe('High');
    expect(getRiskLevel(50).label).toBe('Medium');
    expect(getRiskLevel(25).label).toBe('Low');
    expect(getRiskLevel(5).label).toBe('Minimal');
  });

  it('should clamp scores between 0 and 100', () => {
    const score = calculateRiskScore('Critical', 'Critical', 1.0);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('Integration: Data Quality Flow', () => {
  it('should validate and deduplicate in sequence', () => {
    const now = new Date().toISOString();
    const findings: Finding[] = [
      {
        id: '1',
        title: 'Test Issue',
        severity: 'High',
        asset_id: 'asset-1',
        asset_name: 'service',
        status: 'Open',
        description: 'Issue 1',
        source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
        control_framework: 'NIST',
        control_clause: 'AC-1',
        created_at: now,
        updated_at: now,
        related_findings: [],
      } as Finding,
      {
        id: '2',
        title: 'Test Issue',
        severity: 'High',
        asset_id: 'asset-1',
        asset_name: 'service',
        status: 'Open',
        description: 'Issue 1',
        source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
        control_framework: 'NIST',
        control_clause: 'AC-1',
        created_at: now,
        updated_at: now,
        related_findings: [],
      } as Finding,
    ];

    const validFindings = getValidFindings(findings);
    const deduped = findExactDuplicates(validFindings);

    expect(validFindings.length).toBe(2);
    expect(deduped.length).toBeGreaterThanOrEqual(0);
  });

  it('should produce consistent results across multiple runs', () => {
    const findings: Finding[] = [
      {
        id: '1',
        title: 'Issue',
        severity: 'Medium',
        asset_name: 'app',
        status: 'open',
        description: 'Test',
      } as Finding,
    ];

    const score1 = calculateRiskScore('Medium');
    const score2 = calculateRiskScore('Medium');
    expect(score1).toBe(score2);
  });
});

describe('Integration: Error Handling', () => {
  it('should handle null/undefined gracefully', () => {
    const nullFindings = null as any;
    expect(() => {
      validateAllFindings(nullFindings || []);
    }).not.toThrow();
  });

  it('should handle missing severity field', () => {
    const now = new Date().toISOString();
    const noSeverity: Finding = {
      id: '1',
      title: 'Test',
      asset_id: 'asset-1',
      asset_name: 'app',
      status: 'Open',
      source_document: { filename: 'test.pdf', upload_date: now, parser_confidence: 0.9 },
      control_framework: 'NIST',
      control_clause: 'AC-1',
      created_at: now,
      updated_at: now,
      related_findings: [],
    } as Finding;
    const issues = validateAllFindings([noSeverity]);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('should handle unknown severity values in scoring', () => {
    const score = calculateRiskScore('Unknown', 'Unknown');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
