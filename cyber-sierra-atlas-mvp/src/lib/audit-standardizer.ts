import { Finding } from './schema';
import { ExtractedFinding, ExtractionMetadata } from './report-extractors';
import { AuditReportType } from './audit-types';
import { ManualFindingInput } from './audit-types';

export function standardizeExtractedFindings(
  findings: ExtractedFinding[],
  metadata: ExtractionMetadata,
  reportType: AuditReportType
): Finding[] {
  return findings.map((finding, index) =>
    standardizeSingleFinding(finding, metadata, reportType, index)
  );
}

export function standardizeSingleFinding(
  finding: ExtractedFinding,
  metadata: ExtractionMetadata,
  reportType: AuditReportType,
  index: number = 0
): Finding {
  const id = generateFindingId(metadata.fileName, index);

  return {
    id,
    title: finding.title || `Finding ${index + 1}`,
    description: finding.rawText || finding.title || 'No description provided',
    severity: finding.severity || 'Medium',
    status: 'Open',

    // Source document metadata
    source_document: {
      filename: metadata.fileName,
      upload_date: metadata.extractedAt,
      parser_confidence: metadata.extractionMethod ? 0.85 : 0.7,
      raw_text: finding.rawText
    },

    // Asset mapping (to be filled by user)
    asset_id: `unknown-${index}`,
    asset_name: 'Unspecified',

    // Control mapping (defaults)
    control_framework: mapFrameworkFromReportType(reportType),
    control_clause: 'TBD',
    control_effectiveness: 1.0,

    // Audit metadata
    audit_report_type: reportType,

    // Relationships
    related_findings: [],

    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Flags
    flags: {
      duplicate: false,
      near_duplicate: false
    }
  };
}

export function standardizeManualFinding(input: ManualFindingInput): Finding {
  const id = generateFindingId('manual-entry', Date.now());

  return {
    id,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status || 'Open',

    // Source document
    source_document: {
      filename: 'manual-entry',
      upload_date: new Date().toISOString(),
      parser_confidence: 1.0 // Manual entries have highest confidence
    },

    // Asset mapping
    asset_id: `asset-${input.assetName?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`,
    asset_name: input.assetName || 'Unspecified',

    // Control mapping
    control_framework: mapFrameworkFromReportType(input.auditReportType),
    control_clause: 'TBD',
    control_effectiveness: 1.0,

    // Audit metadata
    audit_report_type: input.auditReportType,

    // Business context
    due_date: input.dueDate,
    remediation_suggested: input.remediation,

    // Relationships
    related_findings: [],

    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Flags
    flags: {
      duplicate: false,
      near_duplicate: false
    }
  };
}

export function generateFindingId(fileName: string, index: number | number): string {
  const timestamp = Date.now();
  const filePrefix = fileName
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .substring(0, 20);
  return `${filePrefix}-${index}-${timestamp}`;
}

function mapFrameworkFromReportType(reportType: AuditReportType): string {
  const mapping: Record<AuditReportType, string> = {
    'pen-test': 'NIST Cybersecurity Framework',
    'external-audit': 'ISO 27001',
    'risk-assessment': 'ISO 27005',
    'vulnerability-scan': 'NIST Special Publication 800-53',
    'internal-audit': 'ISO 27001',
    'third-party-assessment': 'Vendor Security Assessment',
    'regulatory': 'Regulatory Compliance',
    'tabletop-ir': 'NIST Incident Response',
    'incident': 'NIST Incident Response',
    'rcsa': 'Risk Control Self-Assessment',
    'non-conformity': 'Compliance Framework',
    'operational-issue': 'Operational Risk Management'
  };

  return mapping[reportType] || 'General Framework';
}

export function mergeSimilarFindings(findings: Finding[], threshold: number = 0.8): Finding[] {
  const merged: Finding[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < findings.length; i++) {
    if (processed.has(i)) continue;

    const current = findings[i];
    const duplicates: number[] = [];

    for (let j = i + 1; j < findings.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(current.title, findings[j].title);
      if (similarity >= threshold) {
        duplicates.push(j);
        processed.add(j);
      }
    }

    if (duplicates.length > 0) {
      current.related_findings = [...current.related_findings, ...duplicates.map(i => findings[i].id)];
      current.flags = { ...current.flags, near_duplicate: true };
    }

    merged.push(current);
    processed.add(i);
  }

  return merged;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Simple Levenshtein distance approximation
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.includes(shorter)) return 0.9;
  if (shorter.includes(longer)) return 0.85;

  const matches = Math.min(s1.length, s2.length);
  const maxLen = Math.max(s1.length, s2.length);

  return matches / maxLen;
}
