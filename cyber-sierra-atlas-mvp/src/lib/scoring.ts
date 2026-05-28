/**
 * Scoring Engine
 * 
 * Calculates dynamic risk scores based on the interaction of 
 * Finding Severity and Asset Criticality.
 */

export const SEVERITY_WEIGHTS: Record<string, number> = {
  'Critical': 10,
  'High': 7,
  'Medium': 4,
  'Low': 2,
  'Informational': 1,
};

export const CRITICALITY_WEIGHTS: Record<string, number> = {
  'Critical': 2.0, // Multiplier for assets that cause business stoppage
  'High': 1.5,
  'Medium': 1.0,
  'Low': 0.5,
};

/**
 * Calculates a final risk score (0-100).
 * Formula: (SeverityWeight * CriticalityWeight / ControlEffectiveness) * 5
 * Higher control effectiveness reduces the risk score.
 * Example: Critical Finding (10) on Critical Asset (2.0) with no controls (1.0) = (20 / 1.0) * 5 = 100.
 * Example: Same finding with 50% effective controls (0.5) = (20 / 0.5) * 5 = 200 → clamped to 100.
 *
 * Overdue Penalty:
 * - If dueDate is in the past, applies +20% base penalty
 * - Additional +0.5% per day overdue (max +20% additional)
 * - Total penalty range: 20-40% for findings >30 days overdue
 */
export function calculateRiskScore(
  severity: string,
  criticality: string = 'Medium',
  controlEffectiveness: number = 1.0,
  dueDate?: string
): number {
  const sWeight = SEVERITY_WEIGHTS[severity] || 1;
  const cWeight = CRITICALITY_WEIGHTS[criticality] || 1.0;
  const ceWeight = Math.max(controlEffectiveness, 0.1); // Ensure non-zero to avoid division by zero

  let score = (sWeight * cWeight / ceWeight) * 5;

  // Apply overdue penalty if dueDate is provided and in the past
  if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);

    if (now > due) {
      const daysPastDue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      // Base penalty: +20% for any overdue
      // Extended penalty: +0.5% per day past due (max +20% additional)
      // Total penalty range: 20-40% for findings >30 days overdue
      const overduePenalty = 20 + Math.min(20, daysPastDue * 0.5);
      score = score * (1 + overduePenalty / 100);
    }
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Converts a numeric score to a human-readable risk level.
 * Thresholds adjusted for new scoring formula with control effectiveness.
 */
export function getRiskLevel(score: number): { label: string, color: string } {
  if (score >= 90) return { label: 'Extreme', color: 'text-red-600' };
  if (score >= 70) return { label: 'High', color: 'text-orange-600' };
  if (score >= 50) return { label: 'Medium', color: 'text-yellow-600' };
  if (score >= 25) return { label: 'Low', color: 'text-blue-600' };
  return { label: 'Minimal', color: 'text-slate-500' };
}
