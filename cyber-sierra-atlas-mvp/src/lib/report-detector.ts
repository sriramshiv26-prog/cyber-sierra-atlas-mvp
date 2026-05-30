import { AuditReportType, AUDIT_REPORT_TYPES } from './audit-types';

const DETECTION_PATTERNS: Record<AuditReportType, string[]> = {
  'pen-test': ['penetration test', 'pentest', 'pen-test', 'cvss', 'vulnerability', 'attack', 'exploit', 'security test'],
  'external-audit': ['external audit', 'soc 2', 'iso 27001', 'iso27001', 'auditor', 'compliance audit', 'third party audit'],
  'risk-assessment': ['risk assessment', 'risk score', 'risk level', 'threat analysis', 'risk analysis', 'risk evaluation'],
  'vulnerability-scan': ['vulnerability scan', 'nessus', 'qualys', 'cve', 'scanner', 'vulnerability assessment', 'security scan'],
  'internal-audit': ['internal audit', 'self assessment', 'internal control', 'control assessment', 'internal review'],
  'third-party-assessment': ['third party', 'vendor assessment', 'external assessment', 'vendor audit', 'supplier audit'],
  'regulatory': ['regulatory', 'pci dss', 'pci-dss', 'hipaa', 'gdpr', 'compliance', 'regulatory compliance'],
  'incident': ['incident report', 'breach', 'security incident', 'postmortem', 'incident', 'response', 'post-incident'],
  'non-conformity': ['non-conformity', 'non conformance', 'deviation', 'non-conformance', 'nonconformity'],
  'tabletop-ir': ['tabletop', 'incident response', 'drill', 'exercise', 'simulation', 'tabletop exercise'],
  'rcsa': ['rcsa', 'risk control', 'control assessment', 'control evaluation', 'self assessment'],
  'operational-issue': ['operational', 'operational risk', 'process finding', 'operational issue', 'operational control']
};

export function detectReportType(content: string): AuditReportType | null {
  if (!content || typeof content !== 'string') return null;

  const lowerContent = content.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [type, keywords] of Object.entries(DETECTION_PATTERNS)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) matches++;
    }
    if (matches > 0) {
      scores[type] = matches / keywords.length;
    }
  }

  if (Object.keys(scores).length === 0) return null;

  const [topType] = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return topType?.[1] > 0.3 ? (topType[0] as AuditReportType) : null;
}

export function detectByFileName(fileName: string): AuditReportType | null {
  if (!fileName || typeof fileName !== 'string') return null;

  const lower = fileName.toLowerCase();

  if (lower.includes('pentest') || lower.includes('pen-test') || lower.includes('pen_test')) return 'pen-test';
  if (lower.includes('soc2') || lower.includes('iso27001') || lower.includes('iso 27001')) return 'external-audit';
  if (lower.includes('external') && lower.includes('audit')) return 'external-audit';
  if (lower.includes('risk') && lower.includes('assess')) return 'risk-assessment';
  if (lower.includes('scan') || (lower.includes('vulnerability') && lower.includes('scan'))) return 'vulnerability-scan';
  if (lower.includes('nessus') || lower.includes('qualys')) return 'vulnerability-scan';
  if (lower.includes('audit') && lower.includes('internal')) return 'internal-audit';
  if (lower.includes('vendor') && (lower.includes('assessment') || lower.includes('audit'))) return 'third-party-assessment';
  if (lower.includes('pci') || lower.includes('hipaa') || lower.includes('gdpr')) return 'regulatory';
  if (lower.includes('incident')) return 'incident';
  if (lower.includes('tabletop') || (lower.includes('incident') && lower.includes('response'))) return 'tabletop-ir';
  if (lower.includes('rcsa')) return 'rcsa';

  return null;
}

export function detectReportTypeFromBoth(content: string, fileName: string): AuditReportType | null {
  // Try filename first (more explicit), then fall back to content analysis
  const fileDetection = detectByFileName(fileName);
  if (fileDetection) return fileDetection;

  return detectReportType(content);
}

export const DetectionConfidence = {
  HIGH: 0.7,
  MEDIUM: 0.5,
  LOW: 0.3
};
