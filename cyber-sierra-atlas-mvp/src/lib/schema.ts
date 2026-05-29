// Finding record
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Risk Accepted';
  
  // Genealogy
  source_document: {
    filename: string;
    upload_date: string; // ISO8601
    parser_confidence: number; // 0.0-1.0
    raw_text?: string;
  };
  
  // Asset mapping
  asset_id: string;
  asset_name: string;
  
  // Control mapping
  control_framework: string;
  control_clause: string;
  control_description?: string;
  control_effectiveness?: number; // 0.0-1.0, default 1.0 (no mitigation)
  
  // Vulnerability data
  cve?: string;
  cvss_score?: number;
  
  // Business context
  due_date?: string; // ISO8601
  owner?: string;
  /** @deprecated Use remediation_suggested and remediation_confirmed instead */
  remediation_notes?: string;
  evidence_url?: string;

  // Evidence attachments
  evidence?: Array<{
    id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    data_base64: string;
    uploaded_at: string;
  }>;

  // Deduplication (Phase 2B)
  is_confirmed_unique?: boolean;
  duplicate_group_id?: string;

  // Root Cause Analysis (Phase 2B)
  root_cause?: string;
  rca_category?: 'Configuration' | 'Missing Patch' | 'Weak Controls' | 'Design Flaw';

  // Editable Remediation (Phase 2B)
  remediation_suggested?: string;
  remediation_confirmed?: string;
  remediation_last_modified_by?: string;
  remediation_last_modified_at?: string;

  // Relationships
  related_findings: string[];
  deduped_with?: string;
  
  // Metadata
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
  flags?: {
    overdue?: boolean;
    aging?: boolean;
    at_risk?: boolean;
    duplicate?: boolean;
    near_duplicate?: boolean;
  };
}

// Asset / CI
export interface Asset {
  id: string;
  name: string;
  type: 'application' | 'database' | 'infrastructure' | 'saas' | 'vendor' | 'network' | 'other';
  owner?: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  description?: string;
  business_impact?: string;
  annual_revenue_supported?: number;
  records_processed?: number;
  dependencies: string[];
  dependents?: string[];
  created_at: string;
  updated_at: string;
}

// Control framework reference
export interface Control {
  framework: string; // "ISO 27001", "NIST CSF", etc.
  clause: string; // "A.14.2.1"
  description: string;
}

// Deduplication result
export interface Duplicate {
  finding1: string;
  finding2: string;
  reason: string;
  confidence: number;
  action: 'merge' | 'user_review' | 'ignore';
}

// Validation issue
export interface ValidationIssue {
  finding_id: string;
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Top-level store
export interface Store {
  findings: Finding[];
  assets: Asset[];
  controls: Control[];
  lastSaved: string;
}

// UI state (separate from store, not persisted)
export interface UIState {
  view: 'dashboard' | 'register' | 'blast' | 'crosswalk' | 'genealogy' | 'reports';
  filters: {
    q: string;
    severity?: string;
    status?: string;
    source?: string;
    framework?: string;
    owner?: string;
    asset_id?: string;
  };
  drawerId: string | null;
  modalOpen: boolean;
  theme: 'light' | 'dark';
  density: 'comfy' | 'cosy' | 'compact';
}
