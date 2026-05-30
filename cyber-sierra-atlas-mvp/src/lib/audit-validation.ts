import { ManualFindingInput, AuditReportType } from './audit-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export function validateManualEntry(input: Partial<ManualFindingInput>): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!input.title?.trim()) {
    errors.push('Title is required');
  }

  if (!input.description?.trim()) {
    errors.push('Description is required');
  }

  if (!input.severity) {
    errors.push('Severity is required');
  }

  if (!input.auditReportType) {
    errors.push('Report type is required');
  }

  // Date validation if provided
  if (input.dueDate && !isValidDate(input.dueDate)) {
    errors.push('Due date must be valid ISO date (YYYY-MM-DD)');
  }

  // Status validation if provided
  if (input.status && !isValidStatus(input.status)) {
    errors.push('Invalid status value');
  }

  // Asset validation if provided
  if (input.assetType && !isValidAssetType(input.assetType)) {
    errors.push('Invalid asset type');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;

  // Check ISO date format: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  // Validate the date is real
  const date = new Date(dateStr + 'T00:00:00Z');
  const [year, month, day] = dateStr.split('-').map(Number);

  // Reconstruct to check if it's valid (JS will accept 2026-13-01 but it's invalid)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidStatus(status: string): boolean {
  const validStatuses = ['Open', 'In Progress', 'Resolved'];
  return validStatuses.includes(status);
}

export function isValidAssetType(assetType: string): boolean {
  const validTypes = ['Service', 'Network', 'Database', 'Application', 'Infrastructure'];
  return validTypes.includes(assetType);
}

export function isValidSeverity(severity: string): boolean {
  const validSeverities = ['Critical', 'High', 'Medium', 'Low'];
  return validSeverities.includes(severity);
}

export function validateAndNormalize(input: Partial<ManualFindingInput>) {
  const result = validateManualEntry(input);
  return {
    ...result,
    normalized: result.valid ? normalizeInput(input as ManualFindingInput) : null
  };
}

function normalizeInput(input: ManualFindingInput): ManualFindingInput {
  return {
    ...input,
    title: input.title?.trim() || '',
    description: input.description?.trim() || '',
    severity: input.severity || 'Medium',
    auditReportType: input.auditReportType,
    status: input.status || 'Open',
    assetName: input.assetName?.trim(),
    assetType: input.assetType,
    remediation: input.remediation?.trim(),
    dueDate: input.dueDate
  };
}
