import { CapaWorkflow, CapaStatus } from '../types/capa';

// State machine definition: valid transitions from source to target status
const VALID_TRANSITIONS: Record<CapaStatus, CapaStatus[]> = {
  draft: ['rca_pending'],
  rca_pending: ['rca_completed'],
  rca_completed: ['plan_approved'],
  plan_approved: ['implementing'],
  implementing: ['verification_pending'],
  verification_pending: ['closed'],
  closed: [], // Terminal state - no transitions out
};

/**
 * Validates if a CAPA can transition from its current status to a target status.
 * Enforces both state machine rules and validation gates for specific transitions.
 *
 * Gates:
 * - rca_completed: requires problem_statement + at least 1 root_cause
 * - plan_approved: requires action_plan (description, owner, target_date)
 * - closed: requires valid approvals + complete evidence
 */
export function canTransitionTo(capa: CapaWorkflow, targetStatus: CapaStatus): boolean {
  const currentStatus = capa.status;

  // Check state machine validity
  if (!VALID_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
    return false;
  }

  // Enforce gates for specific transitions
  switch (targetStatus) {
    case 'rca_completed':
      // Gate: problem_statement must exist and root_causes must have at least 1 item
      return (
        capa.rca.problem_statement?.trim().length > 0 &&
        capa.rca.root_causes?.length > 0
      );

    case 'plan_approved':
      // Gate: action_plan must be complete (description, owner, target_date all non-empty)
      return (
        capa.action_plan.description?.trim().length > 0 &&
        capa.action_plan.owner?.trim().length > 0 &&
        capa.action_plan.target_date?.trim().length > 0
      );

    case 'closed':
      // Gate: requires valid approvals (both implementer and reviewer approved)
      // AND valid evidence (all required items complete with URLs)
      return validateApprovals(capa) && validateEvidenceChecklist(capa);

    default:
      // No additional gates for other transitions
      return true;
  }
}

/**
 * Validates that both required approvers (implementer and reviewer) have approved.
 * Uses AND logic: both roles MUST have approved:true
 *
 * @returns true only if both implementer and reviewer have approved:true
 */
export function validateApprovals(capa: CapaWorkflow): boolean {
  const approvals = capa.approvals || [];

  // Find approvals by role
  const implementerApproval = approvals.find(a => a.role === 'implementer');
  const reviewerApproval = approvals.find(a => a.role === 'reviewer');

  // Both roles must exist and both must have approved:true
  return (
    implementerApproval?.approved === true &&
    reviewerApproval?.approved === true
  );
}

/**
 * Validates that all required evidence items are complete and have supporting URLs.
 * Optional items are ignored.
 *
 * For each item where required:true:
 * - completed must be true
 * - evidence_urls must be non-empty array (at least 1 URL)
 *
 * If no required items exist, returns true.
 *
 * @returns true if all required evidence items are complete with URLs
 */
export function validateEvidenceChecklist(capa: CapaWorkflow): boolean {
  const checklist = capa.evidence_checklist || [];

  // Filter only required items
  const requiredItems = checklist.filter(item => item.required);

  // If no required items, evidence is valid
  if (requiredItems.length === 0) {
    return true;
  }

  // All required items must be completed with at least one URL
  return requiredItems.every(
    item =>
      item.completed === true &&
      Array.isArray(item.evidence_urls) &&
      item.evidence_urls.length > 0
  );
}

/**
 * Comprehensive validation for CAPA closure.
 * Checks all components: RCA, action plan, approvals, and evidence.
 *
 * @returns true if CAPA is complete in all aspects
 */
export function isCapaComplete(capa: CapaWorkflow): boolean {
  // Validate RCA: must have problem_statement and at least 1 root_cause
  const rcaValid =
    capa.rca.problem_statement?.trim().length > 0 &&
    capa.rca.root_causes?.length > 0;

  // Validate action plan: must have description, owner, and target_date
  const actionPlanValid =
    capa.action_plan.description?.trim().length > 0 &&
    capa.action_plan.owner?.trim().length > 0 &&
    capa.action_plan.target_date?.trim().length > 0;

  // Validate approvals and evidence using their dedicated functions
  const approvalsValid = validateApprovals(capa);
  const evidenceValid = validateEvidenceChecklist(capa);

  return rcaValid && actionPlanValid && approvalsValid && evidenceValid;
}

/**
 * Returns a human-readable label for a CAPA status.
 */
export function getStatusLabel(status: CapaStatus): string {
  const labels: Record<CapaStatus, string> = {
    draft: 'Draft',
    rca_pending: 'RCA Pending',
    rca_completed: 'RCA Completed',
    plan_approved: 'Plan Approved',
    implementing: 'Implementing',
    verification_pending: 'Verification Pending',
    closed: 'Closed',
  };
  return labels[status];
}

/**
 * Calculates the number of days until a due date.
 * Uses Math.ceil for rounding, so partial days round up.
 *
 * @returns positive for future dates, negative for past dates, 0 for today
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();

  // Reset time to midnight for accurate day calculation
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return Math.ceil(diffDays);
}

/**
 * Checks if a due date has passed.
 *
 * @returns true if the due date is in the past
 */
export function isOverdue(dueDate: string): boolean {
  return getDaysUntilDue(dueDate) < 0;
}
