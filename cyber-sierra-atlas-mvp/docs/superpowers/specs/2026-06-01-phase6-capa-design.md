# Phase 6: CAPA & Continuous Monitoring Design Specification

> **For agentic workers:** Use superpowers:subagent-driven-development to execute this design task-by-task with fresh subagents, two-stage review (spec compliance, code quality), and TDD approach.

**Goal:** Implement ISO 27001-compliant CAPA (Corrective and Preventive Action) workflows with structured root cause analysis, flexible evidence collection, and approval gates.

**Architecture:** CAPA as independent entity linked to Finding via `finding_id`, enabling parallel lifecycles. Manual opt-in workflow with state machine (draft → RCA → Plan → Implement → Verify → Closed). Immutable audit trail with approval gates prevents incomplete CAPAs from closing.

**Tech Stack:** React/TypeScript, existing Finding schema, new CapaWorkflow entity, Recharts for timeline visualization, existing useStore dispatch pattern

---

## Data Model

### CapaWorkflow Entity

```typescript
interface CapaWorkflow {
  // Identity & Linking
  id: string;
  finding_id: string; // Link back to Finding
  framework: 'ISO27001' | 'NIST' | 'CIS' | 'SOC2'; // Audit source
  
  // CAPA Metadata
  type: 'corrective' | 'preventive';
  status: 'draft' | 'rca_pending' | 'rca_completed' | 'plan_approved' | 'implementing' | 'verification_pending' | 'closed';
  
  // Root Cause Analysis Section
  rca: {
    problem_statement: string; // What went wrong
    investigation_data: string; // Rich text investigation findings
    root_causes: Array<{
      description: string;
      evidence_urls: string[]; // Investigation evidence
    }>;
    rca_completed_date?: string; // ISO 8601
    rca_completed_by?: string; // User ID
  };
  
  // Action Plan
  action_plan: {
    description: string; // What we're doing to fix it
    owner: string; // User ID
    target_date: string; // ISO 8601
  };
  
  // Timeline Tracking
  timeline: {
    rca_due: string; // ISO 8601
    action_due: string; // ISO 8601
    action_completion_date?: string; // Actual completion
    verification_due?: string; // ISO 8601
  };
  
  // Evidence & Approval
  evidence_checklist: Array<{
    item: string; // "Test results uploaded", "Training completed", etc.
    required: boolean;
    completed: boolean;
    evidence_urls: string[];
    completed_date?: string;
    completed_by?: string;
  }>;
  
  approvals: Array<{
    role: 'implementer' | 'reviewer';
    user: string; // User ID
    approved: boolean;
    timestamp?: string; // ISO 8601
    comments?: string;
  }>;
  
  // Audit Trail
  audit_trail: Array<{
    action: string; // 'created', 'status_changed', 'evidence_uploaded', 'approved'
    user: string;
    timestamp: string; // ISO 8601
    details: Record<string, any>; // Additional context
    immutable: true; // Schema enforcement
  }>;
  
  // Timestamps
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by: string; // User ID
}
```

### Finding Schema Extension

Add optional field to existing Finding:
```typescript
capa_id?: string; // Link to CapaWorkflow (undefined if not in CAPA)
```

---

## UI Components

### 1. CAPA & Monitoring Tab (New)
- New top-level tab in main navigation (alongside Dashboard, Register, BlastRadius, Genealogy, Reports)
- Sub-tabs: Active CAPA Workflows | CAPA History | Continuous Monitoring (Phase 6B)

### 2. Active CAPA Workflows List
- Table columns: Finding ID | Status | Root Cause Summary | Action Owner | Action Due | Days Until Due | Actions
- Filter controls: By status, by owner, by priority, by framework
- Click row to open CAPA detail panel
- Button: "+ Create CAPA" (opens dialog to select finding)

### 3. CAPA Detail Panel (Right-side drawer or modal)

**Header Section:**
- Finding breadcrumb (link back to Register)
- Finding severity badge
- Framework badge (ISO 27001, NIST, etc.)
- "Remove from CAPA" button (unlinks CAPA)

**Section 1: Root Cause Analysis**
- Problem statement (textarea)
- Investigation data (rich text editor with formatting)
- Root causes repeating field:
  - Description (textarea)
  - Evidence file upload (drag-drop, multiple files)
- Mark as "RCA Completed" (checkbox, enables next section)
- Section status indicator (incomplete → complete)

**Section 2: Action Plan**
- Description (textarea: what we're doing to fix it)
- Owner (user dropdown)
- Target date (date picker, cannot be in past)
- Approval indicator (shows if plan is approved)

**Section 3: Evidence & Approval**
- User-defined evidence checklist:
  - Add/edit items
  - Mark complete with file uploads
  - Timestamps shown
- Approver section:
  - Implementer role: checkbox (implementer confirms action taken)
  - Reviewer role: checkbox (reviewer/auditor confirms completeness)
  - Display name + timestamp on approval
- "Request Approval" button (sends notification)

**Section 4: Timeline Visualization**
- Horizontal timeline showing:
  - RCA Due → RCA Complete → Plan Approved → Action Due → Action Complete → Verify Due → Closed
  - Actual dates vs. due dates
  - Color coding: on-track (green) | at-risk (yellow) | overdue (red)

**Footer:**
- Audit trail toggle (expandable list of all changes with user/timestamp)
- Status change dropdown (only valid transitions shown)
- "Close CAPA" button (only enabled if all approvals + evidence complete)

### 4. CAPA History Tab
- Read-only list of closed CAPA records
- Columns: Finding ID | Root Cause | Closure Date | Verification Result
- Click to view closed CAPA (detail panel in read-only mode)
- Search by finding, root cause category, date range

### 5. Continuous Monitoring Dashboard (Phase 6B)
- Last scan results by framework
- Trend chart: CAPA effectiveness rate over time
- Recurring issues: findings that closed CAPA but re-appeared
- Alert threshold status

---

## State Machine & Transitions

```
draft
  ↓ (click "Start RCA")
rca_pending
  ↓ (fill RCA, mark complete)
rca_completed
  ↓ (fill action plan, get approval)
plan_approved
  ↓ (mark "Implementing")
implementing
  ↓ (fill evidence checklist, mark complete)
verification_pending
  ↓ (all approvals signed + evidence complete)
closed
```

**Gates:**
- Cannot move from `rca_pending` to `rca_completed` without problem statement + root cause
- Cannot move from `plan_approved` to `implementing` without action owner + target date
- Cannot move to `closed` without:
  - All required evidence items marked complete
  - Both implementer AND reviewer approvals signed
  - RCA complete
  - Action plan complete

---

## Data Flow & Integration

### Creating CAPA
1. User opens Finding in Register tab
2. Clicks "Create CAPA Workflow" button
3. System creates CapaWorkflow record, links via `finding_id`
4. User redirected to CAPA & Monitoring tab → detail panel opens
5. User fills RCA, action plan, evidence, approvals

### Linking & Unlinking
- **Unlink:** "Remove from CAPA" button unsets `finding_id` on CAPA, but CapaWorkflow persists in History
- **New CAPA:** User can create second CAPA on same finding if first one is closed
- **Finding Closure:** When Remediation closes finding, CAPA remains active (independent lifecycle)

### Approval Workflow
- User fills section → clicks "Request Approval"
- System sends notification to approver role
- Approver opens CAPA detail, reviews, signs off (checkbox + timestamp)
- All approvals required before closure

### Audit Trail
- Every state change: logged with user, timestamp, change reason
- Every evidence upload: timestamped, URL stored, immutable
- Every approval: user, timestamp, optional comments recorded
- Immutable constraint in schema prevents modification

### Continuous Monitoring (Phase 6B)
- Monitoring scans reference CAPA records
- If finding recurs after CAPA closure, dashboard flags as "recurrence"
- Trend analysis: CAPA effectiveness rate (% of closed CAPAs that don't recur within 90 days)

---

## Components & Files to Create

### React Components
1. **CapaAndMonitoringTab.tsx** — Main tab container, routing to sub-tabs
2. **ActiveCapaList.tsx** — List view of open CAPA workflows
3. **CapaDetailPanel.tsx** — Detail panel with all sections (RCA, action plan, evidence, approval)
4. **CapaHistoryList.tsx** — Read-only archive of closed CAPA records
5. **ContinuousMonitoringDashboard.tsx** — Phase 6B: trend charts, recurring issues (optional)

### Utilities & Hooks
1. **capa-utils.ts** — State machine logic, validation, transition rules
2. **useCapaStore.ts** — Custom hook for CAPA state management (dispatch to useStore)
3. **capa-timeline.ts** — Timeline visualization helpers

### Data & Schema
1. **types/capa.ts** — CapaWorkflow interface definitions
2. **hooks/useStore.ts** — ADD actions: CREATE_CAPA, UPDATE_CAPA, CLOSE_CAPA, APPROVE_CAPA, UNLINK_CAPA

---

## Testing Strategy

### Unit Tests (capa-utils.test.ts)
- Valid state transitions
- Invalid transitions blocked
- Approval gates enforced
- Evidence validation

### Component Tests (CapaDetailPanel.test.tsx, ActiveCapaList.test.tsx)
- CAPA detail panel renders all sections
- RCA file uploads save to evidence
- Status transitions trigger UI updates
- Timeline visualization displays correct dates
- Approval checkboxes track who/when

### Integration Tests (integration/capa.test.ts)
- Create Finding → Create CAPA → Verify linking
- Close Finding → CAPA remains active
- Unlink CAPA → Finding continues, CAPA in History
- Multiple CAPAs per finding
- Evidence upload → audit trail logged
- Approval workflow → notifications sent

### Audit Trail Tests
- State changes logged with user/timestamp
- Evidence timestamps immutable
- Approval records cannot be backdated

---

## Success Criteria

- [x] Design approved by user
- [ ] All CAPA state transitions validated (unit tests)
- [ ] Approval gates prevent incomplete CAPAs from closing (integration tests)
- [ ] CAPA detail panel renders correctly with all sections (component tests)
- [ ] Audit trail immutable and queryable (integration tests)
- [ ] Zero regressions in Phase 2/4/5 functionality (full integration tests)
- [ ] All tests passing (100% pass rate target)
- [ ] Commits pushed to GitHub with descriptive messages
- [ ] Phase 6A production-ready (4-5 hours)

---

## Phase 6B: Continuous Monitoring (Optional)

If approved after Phase 6A, Phase 6B adds:
- Dashboard showing last scan results by framework
- Trend chart: CAPA effectiveness over time (% not recurring within 90 days)
- Alert: findings that recurred after CAPA closure
- Monitoring health status (green/yellow/red)

**Timeline:** 3-4 hours (same TDD, subagent, review approach)

---

## References

- ISO 27001:2022 Annex A.16.1 (Monitoring, measurement, analysis and evaluation)
- [How to Implement ISO 27001: A 9-Step Guide](https://grcsolutions.io/9-steps-to-implementing-iso-27001/)
- [The 5 key elements of an effective CAPA system](https://www.greenlight.guru/blog/the-5-key-elements-of-an-effective-capa-system)
- [Effectiveness Checks in the CAPA Process](https://www.mastercontrol.com/gxp-lifeline/how-to-conduct-better-effectiveness-checks-and-management-reviews-within-your-capa-process-/)
