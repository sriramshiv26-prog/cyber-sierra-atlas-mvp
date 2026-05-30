import { Finding } from './schema';
import { FRAMEWORK_CONTROL_MAP } from './framework-constants';

type FrameworkId = 'iso27001' | 'nist_csf' | 'cis_controls';

const FINDING_TYPE_TO_CONTROLS: Record<FrameworkId, Record<string, string[]>> = {
  iso27001: {
    'Access Control': ['A.6.1', 'A.6.2'],
    'Authentication': ['A.6.2'],
    'Password Policy': ['A.6.3'],
    'Encryption': ['A.8.1', 'A.8.2'],
    'Patch Management': ['A.8.3'],
    'Asset Management': ['A.5.1', 'A.5.2'],
    'Configuration': ['A.5.3'],
    'Data Protection': ['A.8.2'],
    'Vulnerability Management': ['A.8.3'],
    'MFA': ['A.6.2'],
    'Incident Response': ['A.5.4'],
    'Network Security': ['A.8.1'],
  },
  nist_csf: {
    'Access Control': ['ID-AM', 'PR-AC'],
    'Authentication': ['PR-AC'],
    'Asset Management': ['ID-AM'],
    'Vulnerability Management': ['ID-IM'],
    'Patch Management': ['PR-AT'],
    'Data Protection': ['PR-DC'],
    'MFA': ['PR-AC'],
    'Incident Response': ['RS-RP'],
  },
  cis_controls: {
    'Access Control': ['2.1', '2.2'],
    'Authentication': ['2.1'],
    'Asset Management': ['1.1'],
    'Inventory': ['1.1', '1.2'],
    'Patch Management': ['3.1', '3.2'],
    'MFA': ['2.1'],
    'Network Security': ['3.1'],
  },
};

export function mapFindingToControls(
  finding: Finding,
  frameworkId: FrameworkId,
  findingType?: string
): string[] {
  const typeToControls = FINDING_TYPE_TO_CONTROLS[frameworkId];
  if (!typeToControls) return [];

  // Use provided findingType or try to infer from finding attributes
  const type = findingType || inferFindingType(finding);
  if (!type) return [];

  const controls = typeToControls[type] || [];
  return controls;
}

function inferFindingType(finding: Finding): string | null {
  const title = (finding.title || '').toLowerCase();
  const description = (finding.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  const typePatterns: Record<string, RegExp> = {
    'Access Control': /access|permission|role|authorization/i,
    'Authentication': /auth|login|password|mfa|2fa|multi-factor/i,
    'Encryption': /encrypt|cipher|ssl|tls|https/i,
    'Patch Management': /patch|update|upgrade|vulnerability/i,
    'Asset Management': /asset|inventory|configuration|ci/i,
    'Data Protection': /data|pii|gdpr|encryption/i,
    'MFA': /mfa|2fa|multi-factor|multifactor/i,
    'Network Security': /network|firewall|vpc|subnet/i,
    'Vulnerability': /vulnerability|cve|cvss|weakness/i,
  };

  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(combined)) {
      return type;
    }
  }

  return null;
}

export function calculateFrameworkCoverage(
  findings: Finding[],
  frameworkId: FrameworkId
): number {
  const frameworkControls = FRAMEWORK_CONTROL_MAP[frameworkId] || [];
  if (frameworkControls.length === 0) return 0;

  const coveredControls = new Set<string>();

  findings.forEach(finding => {
    const controls = mapFindingToControls(finding, frameworkId);
    controls.forEach(control => {
      coveredControls.add(control);
    });
  });

  return Math.round((coveredControls.size / frameworkControls.length) * 100);
}

export function getFrameworkGaps(
  findings: Finding[],
  frameworkId: FrameworkId
): string[] {
  const frameworkControls = FRAMEWORK_CONTROL_MAP[frameworkId] || [];
  const coveredControls = new Set<string>();

  findings.forEach(finding => {
    const controls = mapFindingToControls(finding, frameworkId);
    controls.forEach(control => {
      coveredControls.add(control);
    });
  });

  return frameworkControls.filter(control => !coveredControls.has(control));
}

export function getControlSeverity(findings: Finding[], control: string): string {
  const relatedFindings = findings.filter(f => {
    const controls = mapFindingToControls(f, 'iso27001');
    return controls.includes(control);
  });

  if (relatedFindings.length === 0) return 'None';

  // Get highest severity
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Informational': 4 };
  return relatedFindings.reduce((highest, finding) => {
    const currentIndex = severityOrder[finding.severity as keyof typeof severityOrder] || 4;
    const highestIndex = severityOrder[highest as keyof typeof severityOrder] || 4;
    return currentIndex < highestIndex ? finding.severity : highest;
  });
}

export function getAllFrameworkCoverage(findings: Finding[]): Record<string, number> {
  return {
    iso27001: calculateFrameworkCoverage(findings, 'iso27001'),
    nist_csf: calculateFrameworkCoverage(findings, 'nist_csf'),
    cis_controls: calculateFrameworkCoverage(findings, 'cis_controls'),
  };
}
