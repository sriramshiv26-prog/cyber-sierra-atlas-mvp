export type AuditReportType =
  | 'non-conformity'
  | 'pen-test'
  | 'third-party-assessment'
  | 'external-audit'
  | 'risk-assessment'
  | 'vulnerability-scan'
  | 'internal-audit'
  | 'regulatory'
  | 'tabletop-ir'
  | 'incident'
  | 'rcsa'
  | 'operational-issue';

export const AUDIT_REPORT_TYPES: AuditReportType[] = [
  'non-conformity',
  'pen-test',
  'third-party-assessment',
  'external-audit',
  'risk-assessment',
  'vulnerability-scan',
  'internal-audit',
  'regulatory',
  'tabletop-ir',
  'incident',
  'rcsa',
  'operational-issue'
];

export const REPORT_TYPE_LABELS: Record<AuditReportType, string> = {
  'non-conformity': 'Non-Conformity',
  'pen-test': 'Penetration Test',
  'third-party-assessment': 'Third-Party Assessment',
  'external-audit': 'External Audit',
  'risk-assessment': 'Risk Assessment',
  'vulnerability-scan': 'Vulnerability Scan',
  'internal-audit': 'Internal Audit',
  'regulatory': 'Regulatory',
  'tabletop-ir': 'Tabletop / IR',
  'incident': 'Incident',
  'rcsa': 'RCSA',
  'operational-issue': 'Operational Issue'
};

export function isAuditReport(type: string): type is AuditReportType {
  return AUDIT_REPORT_TYPES.includes(type as AuditReportType);
}

export function getReportTypeLabel(type: AuditReportType): string {
  return REPORT_TYPE_LABELS[type];
}

// Manual entry form schema
export interface ManualFindingInput {
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  assetName: string;
  assetType: 'Service' | 'Network' | 'Database' | 'Application' | 'Infrastructure';
  remediation?: string;
  deadline?: string; // ISO date string
  auditReportType: AuditReportType;
}

export const SEVERITY_ORDER: Record<string, number> = {
  'Critical': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3
};

export const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'] as const;
export const ASSET_TYPES = ['Service', 'Network', 'Database', 'Application', 'Infrastructure'] as const;
