import { Finding, ValidationIssue } from './schema';

/**
 * Validation Rules Engine
 * 
 * Ensures data integrity before findings enter the store.
 * We categorize issues into 'error' (blocking) and 'warning' (non-blocking).
 */

type ValidationRule = {
  field: keyof Finding;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  validator: (f: Finding) => boolean;
};

const RULES: ValidationRule[] = [
  {
    field: 'title',
    rule: 'required',
    message: 'Finding title is required',
    severity: 'error',
    validator: (f) => !!f.title && f.title.trim().length > 0,
  },
  {
    field: 'severity',
    rule: 'required',
    message: 'Severity rating is required',
    severity: 'error',
    validator: (f) => !!f.severity,
  },
  {
    field: 'asset_name',
    rule: 'required',
    message: 'Associated asset name is required',
    severity: 'error',
    validator: (f) => !!f.asset_name && f.asset_name !== 'Unknown Asset',
  },
  {
    field: 'due_date',
    rule: 'invalid_date',
    message: 'Invalid date format for remediation due date',
    severity: 'error',
    validator: (f) => !f.due_date || !isNaN(Date.parse(f.due_date)),
  },
  {
    field: 'due_date',
    rule: 'overdue',
    message: 'Remediation due date is in the past',
    severity: 'warning',
    validator: (f) => {
      if (!f.due_date) return true;
      return new Date(f.due_date) >= new Date();
    },
  },
  {
    field: 'cve',
    rule: 'format',
    message: 'CVE identifier format is incorrect (Expected CVE-YYYY-NNNN)',
    severity: 'warning',
    validator: (f) => !f.cve || /^CVE-\d{4}-\d{4,}$/.test(f.cve),
  },
  {
    field: 'status',
    rule: 'critical_open',
    message: 'Critical findings must have a remediation plan or status update',
    severity: 'warning',
    validator: (f) => {
      if (f.severity === 'Critical' && f.status === 'Open') {
        return !!f.description && f.description.length > 50;
      }
      return true;
    },
  },
];

/**
 * Validates a single finding against all defined rules.
 */
export function validateFinding(finding: Finding): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const rule of RULES) {
    if (!rule.validator(finding)) {
      issues.push({
        finding_id: finding.id,
        field: rule.field as string,
        rule: rule.rule,
        message: rule.message,
        severity: rule.severity,
      });
    }
  }

  return issues;
}

/**
 * Validates an array of findings and returns a flat list of all issues.
 */
export function validateAllFindings(findings: Finding[]): ValidationIssue[] {
  return findings.flatMap(f => validateFinding(f));
}

/**
 * Filter findings to only those that have NO 'error' level validation issues.
 */
export function getValidFindings(findings: Finding[]): Finding[] {
  return findings.filter(f => {
    const issues = validateFinding(f);
    return !issues.some(i => i.severity === 'error');
  });
}
