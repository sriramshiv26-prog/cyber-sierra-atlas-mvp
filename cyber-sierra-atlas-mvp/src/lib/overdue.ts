import { Finding } from './schema';

export interface OverdueMetrics {
  count: number;
  mostOverdueId?: string;
  mostOverdueReason?: string;
  oldestOverdueDateMs: number;
}

export interface OverdueStatus {
  isOverdue: boolean;
  isWildlyOverdue: boolean; // >30 days overdue
  daysOverdue: number;
  daysUntilDue: number;
}

/**
 * Calculate if a finding is overdue and by how much.
 */
export function calculateOverdueStatus(finding: Finding): OverdueStatus {
  if (!finding.due_date) {
    return {
      isOverdue: false,
      isWildlyOverdue: false,
      daysOverdue: 0,
      daysUntilDue: Infinity,
    };
  }

  const now = new Date();
  const due = new Date(finding.due_date);
  const diffMs = now.getTime() - due.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isOverdue: days > 0 && finding.status !== 'Closed' && finding.status !== 'Resolved',
    isWildlyOverdue: days > 30 && finding.status !== 'Closed' && finding.status !== 'Resolved',
    daysOverdue: Math.max(0, days),
    daysUntilDue: days < 0 ? Math.abs(days) : 0,
  };
}

/**
 * Get all overdue findings from a set of findings.
 */
export function getOverdueFindings(findings: Finding[]): Finding[] {
  return findings.filter(f => {
    const status = calculateOverdueStatus(f);
    return status.isOverdue;
  });
}

/**
 * Calculate overdue metrics for dashboard KPI.
 */
export function calculateOverdueMetrics(findings: Finding[]): OverdueMetrics {
  const overdue = getOverdueFindings(findings);

  if (overdue.length === 0) {
    return {
      count: 0,
      oldestOverdueDateMs: 0,
    };
  }

  // Find most overdue
  let mostOverdue = overdue[0];
  let maxDays = calculateOverdueStatus(overdue[0]).daysOverdue;

  for (const f of overdue) {
    const status = calculateOverdueStatus(f);
    if (status.daysOverdue > maxDays) {
      maxDays = status.daysOverdue;
      mostOverdue = f;
    }
  }

  const oldestDate = new Date(mostOverdue.due_date!);

  return {
    count: overdue.length,
    mostOverdueId: mostOverdue.id,
    mostOverdueReason: `${mostOverdue.title} (${maxDays} days overdue)`,
    oldestOverdueDateMs: oldestDate.getTime(),
  };
}

/**
 * Get human-readable overdue label.
 */
export function getOverdueLabel(finding: Finding): string {
  const status = calculateOverdueStatus(finding);

  if (!status.isOverdue) {
    if (finding.due_date) {
      return `Due in ${status.daysUntilDue} day${status.daysUntilDue !== 1 ? 's' : ''}`;
    }
    return 'No due date';
  }

  if (status.daysOverdue === 1) return 'Overdue 1 day';
  return `Overdue ${status.daysOverdue} days`;
}

/**
 * Risk score multiplier for overdue findings.
 * Findings overdue >30 days get +20% risk penalty.
 */
export function getOverdueRiskMultiplier(finding: Finding): number {
  const status = calculateOverdueStatus(finding);
  if (status.isWildlyOverdue) return 1.2; // +20% penalty
  if (status.isOverdue) return 1.1; // +10% penalty for recent overdue
  return 1.0; // No penalty if not overdue
}
