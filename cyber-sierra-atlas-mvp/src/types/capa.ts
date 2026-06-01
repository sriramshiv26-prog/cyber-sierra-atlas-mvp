export type CapaStatus =
  | 'draft'
  | 'rca_pending'
  | 'rca_completed'
  | 'plan_approved'
  | 'implementing'
  | 'verification_pending'
  | 'closed';

export type CapaType = 'corrective' | 'preventive';

export type Framework = 'ISO27001' | 'NIST' | 'CIS' | 'SOC2';

export type ApprovalRole = 'implementer' | 'reviewer';

export interface RootCause {
  description: string;
  evidence_urls: string[];
}

export interface RcaSection {
  problem_statement: string;
  investigation_data: string;
  root_causes: RootCause[];
  rca_completed_date?: string;
  rca_completed_by?: string;
}

export interface ActionPlan {
  description: string;
  owner: string;
  target_date: string;
}

export interface Timeline {
  rca_due: string;
  action_due: string;
  action_completion_date?: string;
  verification_due?: string;
}

export interface EvidenceItem {
  item: string;
  required: boolean;
  completed: boolean;
  evidence_urls: string[];
  completed_date?: string;
  completed_by?: string;
}

export interface Approval {
  role: ApprovalRole;
  user: string;
  approved: boolean;
  timestamp?: string;
  comments?: string;
}

export interface AuditTrailEntry {
  action: string;
  user: string;
  timestamp: string;
  details: Record<string, any>;
  immutable: true;
}

export interface CapaWorkflow {
  id: string;
  finding_id: string;
  framework: Framework;
  type: CapaType;
  status: CapaStatus;
  rca: RcaSection;
  action_plan: ActionPlan;
  timeline: Timeline;
  evidence_checklist: EvidenceItem[];
  approvals: Approval[];
  audit_trail: AuditTrailEntry[];
  created_at: string;
  updated_at: string;
  created_by: string;
}
