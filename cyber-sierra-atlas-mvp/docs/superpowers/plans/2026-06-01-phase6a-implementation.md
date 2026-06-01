# Phase 6A: CAPA Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Fresh subagent per task, two-stage review (spec compliance, code quality), TDD approach. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ISO 27001-compliant CAPA (Corrective and Preventive Action) workflows with structured root cause analysis, flexible evidence collection, and approval gates.

**Architecture:** CAPA as independent entity (CapaWorkflow) linked to Finding via `finding_id`, enabling parallel lifecycles. Manual opt-in workflow with state machine (draft → RCA → Plan → Implement → Verify → Closed). Immutable audit trail prevents incomplete CAPAs from closing. Approval gates enforce evidence + reviewer sign-off before closure.

**Tech Stack:** React 18, TypeScript, Recharts (timeline visualization), Tailwind CSS, existing useStore dispatch pattern (Phase 5 style), localStorage for persistence

**Model Strategy:** Qwen2.5-coder-1.5B for Tasks 1-4, 6-7 (mechanical). Claude Sonnet for Task 5 (state machine judgment). Two-stage review per task.

---

## Task 1: CapaWorkflow Entity & Types

**Files:**
- Create: `src/types/capa.ts`
- Modify: `src/hooks/useStore.tsx` (add 6 CAPA actions)

### Step 1.1: Write CapaWorkflow type definition test

- [ ] Create `tests/lib/capa-types.test.ts` with basic type validation

```typescript
import { CapaWorkflow, CapaStatus } from '../src/types/capa';

describe('CapaWorkflow Types', () => {
  it('should create valid CAPA record with all required fields', () => {
    const capa: CapaWorkflow = {
      id: 'capa-1',
      finding_id: 'finding-123',
      framework: 'ISO27001',
      type: 'corrective',
      status: 'draft',
      rca: {
        problem_statement: '',
        investigation_data: '',
        root_causes: [],
      },
      action_plan: {
        description: '',
        owner: '',
        target_date: '',
      },
      timeline: {
        rca_due: '',
        action_due: '',
      },
      evidence_checklist: [],
      approvals: [],
      audit_trail: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
    };
    expect(capa.id).toBe('capa-1');
    expect(capa.status).toBe('draft');
  });

  it('should validate status is one of allowed values', () => {
    const validStatuses: CapaStatus[] = [
      'draft',
      'rca_pending',
      'rca_completed',
      'plan_approved',
      'implementing',
      'verification_pending',
      'closed',
    ];
    validStatuses.forEach(status => {
      expect(status).toBeTruthy();
    });
  });
});
```

### Step 1.2: Run test to verify it fails

- [ ] Run: `npm test -- tests/lib/capa-types.test.ts`
- [ ] Expected: FAIL with "CapaWorkflow not defined"

### Step 1.3: Create CapaWorkflow type definition

- [ ] Create file `src/types/capa.ts`:

```typescript
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
```

### Step 1.4: Run test to verify it passes

- [ ] Run: `npm test -- tests/lib/capa-types.test.ts`
- [ ] Expected: PASS

### Step 1.5: Add CAPA actions to useStore

- [ ] Modify `src/hooks/useStore.tsx`, add to action types:

```typescript
export type Action = 
  | // ... existing actions
  | { type: 'CREATE_CAPA'; payload: CapaWorkflow }
  | { type: 'UPDATE_CAPA'; payload: { id: string; updates: Partial<CapaWorkflow> } }
  | { type: 'CLOSE_CAPA'; payload: { id: string; closed_at: string } }
  | { type: 'APPROVE_CAPA'; payload: { id: string; role: ApprovalRole; user: string } }
  | { type: 'UNLINK_CAPA'; payload: { capa_id: string } }
  | { type: 'ADD_EVIDENCE'; payload: { capa_id: string; evidence: EvidenceItem } };
```

### Step 1.6: Add CAPA reducer cases

- [ ] Modify `src/hooks/useStore.tsx`, add to reducer:

```typescript
case 'CREATE_CAPA':
  const newCapa = {
    ...action.payload,
    audit_trail: [{
      action: 'created',
      user: action.payload.created_by,
      timestamp: new Date().toISOString(),
      details: { status: 'draft' },
      immutable: true,
    }],
  };
  return {
    ...state,
    capas: [...(state.capas || []), newCapa],
  };

case 'UPDATE_CAPA':
  return {
    ...state,
    capas: (state.capas || []).map(c => 
      c.id === action.payload.id
        ? {
            ...c,
            ...action.payload.updates,
            updated_at: new Date().toISOString(),
            audit_trail: [...c.audit_trail, {
              action: 'updated',
              user: 'system', // Replace with current user
              timestamp: new Date().toISOString(),
              details: action.payload.updates,
              immutable: true,
            }],
          }
        : c
    ),
  };

case 'CLOSE_CAPA':
  return {
    ...state,
    capas: (state.capas || []).map(c =>
      c.id === action.payload.id
        ? {
            ...c,
            status: 'closed' as CapaStatus,
            updated_at: action.payload.closed_at,
            audit_trail: [...c.audit_trail, {
              action: 'closed',
              user: 'system',
              timestamp: action.payload.closed_at,
              details: { previous_status: c.status },
              immutable: true,
            }],
          }
        : c
    ),
  };

case 'APPROVE_CAPA':
  return {
    ...state,
    capas: (state.capas || []).map(c =>
      c.id === action.payload.id
        ? {
            ...c,
            approvals: c.approvals.map(a =>
              a.role === action.payload.role
                ? { ...a, approved: true, timestamp: new Date().toISOString(), user: action.payload.user }
                : a
            ),
            audit_trail: [...c.audit_trail, {
              action: 'approved',
              user: action.payload.user,
              timestamp: new Date().toISOString(),
              details: { role: action.payload.role },
              immutable: true,
            }],
          }
        : c
    ),
  };

case 'UNLINK_CAPA':
  return {
    ...state,
    findings: (state.findings || []).map(f =>
      f.capa_id === action.payload.capa_id
        ? { ...f, capa_id: undefined }
        : f
    ),
  };

case 'ADD_EVIDENCE':
  return {
    ...state,
    capas: (state.capas || []).map(c =>
      c.id === action.payload.capa_id
        ? {
            ...c,
            evidence_checklist: [...c.evidence_checklist, action.payload.evidence],
            audit_trail: [...c.audit_trail, {
              action: 'evidence_added',
              user: 'system',
              timestamp: new Date().toISOString(),
              details: { item: action.payload.evidence.item },
              immutable: true,
            }],
          }
        : c
    ),
  };
```

### Step 1.7: Add AppState type extension

- [ ] Modify `src/hooks/useStore.tsx` AppState interface:

```typescript
export interface AppState {
  // ... existing fields
  capas?: CapaWorkflow[];
}
```

### Step 1.8: Commit

- [ ] Run: `npm test -- tests/lib/capa-types.test.ts`
- [ ] Expected: PASS
- [ ] Git add & commit:

```bash
git add src/types/capa.ts src/hooks/useStore.tsx tests/lib/capa-types.test.ts
git commit -m "feat: add CapaWorkflow entity types and useStore actions"
```

---

## Task 2: CAPA Detail Panel Component

**Files:**
- Create: `src/components/CapaDetailPanel.tsx`
- Create: `tests/components/CapaDetailPanel.test.tsx`

### Step 2.1: Write test for RCA section rendering

- [ ] Create `tests/components/CapaDetailPanel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CapaDetailPanel } from '../src/components/CapaDetailPanel';
import { CapaWorkflow } from '../src/types/capa';

const mockCapa: CapaWorkflow = {
  id: 'capa-1',
  finding_id: 'finding-123',
  framework: 'ISO27001',
  type: 'corrective',
  status: 'draft',
  rca: {
    problem_statement: 'SSH keys exposed in logs',
    investigation_data: 'Found in application logs from 2026-05-15',
    root_causes: [{ description: 'Insufficient log filtering', evidence_urls: [] }],
  },
  action_plan: {
    description: 'Implement log redaction',
    owner: 'user-1',
    target_date: '2026-06-15',
  },
  timeline: {
    rca_due: '2026-06-05',
    action_due: '2026-06-15',
  },
  evidence_checklist: [],
  approvals: [
    { role: 'implementer', user: '', approved: false },
    { role: 'reviewer', user: '', approved: false },
  ],
  audit_trail: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  created_by: 'user-1',
};

describe('CapaDetailPanel', () => {
  it('should render RCA section with problem statement', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={jest.fn()} />);
    expect(screen.getByText('Root Cause Analysis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SSH keys exposed in logs')).toBeInTheDocument();
  });

  it('should render action plan section', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={jest.fn()} />);
    expect(screen.getByText('Action Plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Implement log redaction')).toBeInTheDocument();
  });

  it('should render evidence checklist section', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={jest.fn()} />);
    expect(screen.getByText('Evidence & Approval')).toBeInTheDocument();
  });
});
```

### Step 2.2: Run test to verify it fails

- [ ] Run: `npm test -- tests/components/CapaDetailPanel.test.tsx`
- [ ] Expected: FAIL with "CapaDetailPanel is not exported"

### Step 2.3: Create CapaDetailPanel component

- [ ] Create `src/components/CapaDetailPanel.tsx`:

```typescript
import React, { useState } from 'react';
import { CapaWorkflow, EvidenceItem } from '../types/capa';

interface CapaDetailPanelProps {
  capa: CapaWorkflow;
  onSave: (capa: CapaWorkflow) => void;
  readonly?: boolean;
}

export const CapaDetailPanel: React.FC<CapaDetailPanelProps> = ({ 
  capa, 
  onSave,
  readonly = false 
}) => {
  const [formData, setFormData] = useState(capa);
  const [activeSection, setActiveSection] = useState<'rca' | 'action' | 'evidence' | 'timeline'>('rca');

  const handleRcaChange = (field: keyof typeof capa.rca, value: any) => {
    setFormData({
      ...formData,
      rca: { ...formData.rca, [field]: value },
    });
  };

  const handleActionPlanChange = (field: keyof typeof capa.action_plan, value: string) => {
    setFormData({
      ...formData,
      action_plan: { ...formData.action_plan, [field]: value },
    });
  };

  const handleAddRootCause = () => {
    setFormData({
      ...formData,
      rca: {
        ...formData.rca,
        root_causes: [...formData.rca.root_causes, { description: '', evidence_urls: [] }],
      },
    });
  };

  const handleRootCauseChange = (index: number, description: string) => {
    const updated = [...formData.rca.root_causes];
    updated[index].description = description;
    setFormData({
      ...formData,
      rca: { ...formData.rca, root_causes: updated },
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-white">
          CAPA Workflow: {capa.finding_id}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Framework: {capa.framework} | Type: {capa.type} | Status: {capa.status}
        </p>
      </div>

      {/* Section Tabs */}
      <div className="mb-6 flex border-b dark:border-gray-700">
        {['rca', 'action', 'evidence', 'timeline'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSection === section
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            disabled={readonly}
          >
            {section === 'rca' && 'Root Cause Analysis'}
            {section === 'action' && 'Action Plan'}
            {section === 'evidence' && 'Evidence & Approval'}
            {section === 'timeline' && 'Timeline'}
          </button>
        ))}
      </div>

      {/* RCA Section */}
      {activeSection === 'rca' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Root Cause Analysis</h3>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Problem Statement *
            </label>
            <textarea
              value={formData.rca.problem_statement}
              onChange={(e) => handleRcaChange('problem_statement', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
              rows={3}
              placeholder="What went wrong?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Investigation Data *
            </label>
            <textarea
              value={formData.rca.investigation_data}
              onChange={(e) => handleRcaChange('investigation_data', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
              rows={3}
              placeholder="Findings from investigation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Root Causes *
            </label>
            {formData.rca.root_causes.map((rc, idx) => (
              <div key={idx} className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                <textarea
                  value={rc.description}
                  onChange={(e) => handleRootCauseChange(idx, e.target.value)}
                  disabled={readonly}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
                  rows={2}
                  placeholder="Root cause description"
                />
              </div>
            ))}
            {!readonly && (
              <button
                onClick={handleAddRootCause}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Root Cause
              </button>
            )}
          </div>

          {!readonly && (
            <button
              onClick={handleSave}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Action Plan Section */}
      {activeSection === 'action' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Action Plan</h3>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.action_plan.description}
              onChange={(e) => handleActionPlanChange('description', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
              rows={3}
              placeholder="What will we do to fix it?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Owner *
            </label>
            <input
              type="text"
              value={formData.action_plan.owner}
              onChange={(e) => handleActionPlanChange('owner', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
              placeholder="User ID or name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Target Date *
            </label>
            <input
              type="date"
              value={formData.action_plan.target_date}
              onChange={(e) => handleActionPlanChange('target_date', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white"
            />
          </div>

          {!readonly && (
            <button
              onClick={handleSave}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Evidence & Approval Section */}
      {activeSection === 'evidence' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Evidence & Approval</h3>

          <div>
            <h4 className="font-medium dark:text-gray-300 mb-3">Evidence Checklist</h4>
            {formData.evidence_checklist.map((item, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={readonly}
                    className="w-4 h-4"
                  />
                  <span className="dark:text-gray-300">{item.item}</span>
                </label>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium dark:text-gray-300 mb-3">Approvals</h4>
            {formData.approvals.map((approval, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approval.approved}
                    disabled={readonly}
                    className="w-4 h-4"
                  />
                  <span className="dark:text-gray-300">
                    {approval.role === 'implementer' ? 'Implementer' : 'Reviewer'} Approval
                  </span>
                </label>
                {approval.timestamp && (
                  <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                    {approval.user} on {new Date(approval.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {activeSection === 'timeline' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm dark:text-gray-300">
              <span>RCA Due:</span>
              <span className="font-medium">{formData.timeline.rca_due}</span>
            </div>
            <div className="flex justify-between items-center text-sm dark:text-gray-300">
              <span>Action Due:</span>
              <span className="font-medium">{formData.timeline.action_due}</span>
            </div>
            {formData.timeline.action_completion_date && (
              <div className="flex justify-between items-center text-sm dark:text-gray-300">
                <span>Action Completed:</span>
                <span className="font-medium">{formData.timeline.action_completion_date}</span>
              </div>
            )}
            {formData.timeline.verification_due && (
              <div className="flex justify-between items-center text-sm dark:text-gray-300">
                <span>Verification Due:</span>
                <span className="font-medium">{formData.timeline.verification_due}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Step 2.4: Run test to verify it passes

- [ ] Run: `npm test -- tests/components/CapaDetailPanel.test.tsx`
- [ ] Expected: PASS

### Step 2.5: Commit

- [ ] Run: `npm test -- tests/components/CapaDetailPanel.test.tsx`
- [ ] Expected: PASS
- [ ] Git add & commit:

```bash
git add src/components/CapaDetailPanel.tsx tests/components/CapaDetailPanel.test.tsx
git commit -m "feat: create CAPA detail panel with RCA, action plan, evidence sections"
```

---

## Task 3: Active CAPA List Component

**Files:**
- Create: `src/components/ActiveCapaList.tsx`
- Create: `tests/components/ActiveCapaList.test.tsx`

### Step 3.1: Write test for CAPA list rendering

- [ ] Create `tests/components/ActiveCapaList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { ActiveCapaList } from '../src/components/ActiveCapaList';
import { CapaWorkflow } from '../src/types/capa';

const mockCapas: CapaWorkflow[] = [
  {
    id: 'capa-1',
    finding_id: 'finding-123',
    framework: 'ISO27001',
    type: 'corrective',
    status: 'rca_pending',
    rca: { problem_statement: 'SSH keys exposed', investigation_data: '', root_causes: [] },
    action_plan: { description: '', owner: 'user-1', target_date: '2026-06-15' },
    timeline: { rca_due: '2026-06-05', action_due: '2026-06-15' },
    evidence_checklist: [],
    approvals: [],
    audit_trail: [],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    created_by: 'user-1',
  },
];

describe('ActiveCapaList', () => {
  it('should render table with CAPA records', () => {
    render(<ActiveCapaList capas={mockCapas} onSelectCapa={jest.fn()} />);
    expect(screen.getByText('finding-123')).toBeInTheDocument();
    expect(screen.getByText('rca_pending')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(<ActiveCapaList capas={mockCapas} onSelectCapa={jest.fn()} />);
    expect(screen.getByPlaceholderText(/filter by status/i)).toBeInTheDocument();
  });

  it('should call onSelectCapa when row is clicked', () => {
    const onSelect = jest.fn();
    render(<ActiveCapaList capas={mockCapas} onSelectCapa={onSelect} />);
    screen.getByText('finding-123').closest('tr')?.click();
    expect(onSelect).toHaveBeenCalledWith(mockCapas[0]);
  });
});
```

### Step 3.2: Run test to verify it fails

- [ ] Run: `npm test -- tests/components/ActiveCapaList.test.tsx`
- [ ] Expected: FAIL with "ActiveCapaList is not exported"

### Step 3.3: Create ActiveCapaList component

- [ ] Create `src/components/ActiveCapaList.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { CapaWorkflow, CapaStatus } from '../types/capa';

interface ActiveCapaListProps {
  capas: CapaWorkflow[];
  onSelectCapa: (capa: CapaWorkflow) => void;
}

export const ActiveCapaList: React.FC<ActiveCapaListProps> = ({ capas, onSelectCapa }) => {
  const [statusFilter, setStatusFilter] = useState<CapaStatus | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCapas = useMemo(() => {
    return capas.filter(capa => {
      const matchesStatus = !statusFilter || capa.status === statusFilter;
      const matchesOwner = !ownerFilter || capa.action_plan.owner.includes(ownerFilter);
      const matchesSearch = !searchTerm || 
        capa.finding_id.includes(searchTerm) || 
        capa.rca.problem_statement.includes(searchTerm);
      return matchesStatus && matchesOwner && matchesSearch;
    });
  }, [capas, statusFilter, ownerFilter, searchTerm]);

  const getStatusColor = (status: CapaStatus) => {
    const colors: Record<CapaStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      rca_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      rca_completed: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      plan_approved: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      implementing: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
      verification_pending: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
      closed: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    };
    return colors[status];
  };

  const getDaysUntilDue = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search finding ID or problem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CapaStatus | '')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          >
            <option value="">Filter by status</option>
            <option value="draft">Draft</option>
            <option value="rca_pending">RCA Pending</option>
            <option value="rca_completed">RCA Completed</option>
            <option value="plan_approved">Plan Approved</option>
            <option value="implementing">Implementing</option>
            <option value="verification_pending">Verification Pending</option>
          </select>
          <input
            type="text"
            placeholder="Filter by owner..."
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-slate-800 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Finding ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Root Cause</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Owner</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Action Due</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {filteredCapas.map((capa) => (
              <tr
                key={capa.id}
                onClick={() => onSelectCapa(capa)}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.finding_id}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(capa.status)}`}>
                    {capa.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300 max-w-xs truncate">
                  {capa.rca.root_causes[0]?.description || capa.rca.problem_statement}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.action_plan.owner}</td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.action_plan.target_date}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className={getDaysUntilDue(capa.action_plan.target_date) < 0 ? 'text-red-600' : 'dark:text-gray-300'}>
                    {getDaysUntilDue(capa.action_plan.target_date)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCapas.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No active CAPA workflows found
        </div>
      )}
    </div>
  );
};
```

### Step 3.4: Run test to verify it passes

- [ ] Run: `npm test -- tests/components/ActiveCapaList.test.tsx`
- [ ] Expected: PASS

### Step 3.5: Commit

- [ ] Git add & commit:

```bash
git add src/components/ActiveCapaList.tsx tests/components/ActiveCapaList.test.tsx
git commit -m "feat: create active CAPA list with filtering and status indicators"
```

---

## Task 4: CAPA History Component

**Files:**
- Create: `src/components/CapaHistoryList.tsx`
- Create: `tests/components/CapaHistoryList.test.tsx`

### Step 4.1: Write test for history list

- [ ] Create `tests/components/CapaHistoryList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CapaHistoryList } from '../src/components/CapaHistoryList';
import { CapaWorkflow } from '../src/types/capa';

const closedCapa: CapaWorkflow = {
  id: 'capa-closed-1',
  finding_id: 'finding-456',
  framework: 'ISO27001',
  type: 'corrective',
  status: 'closed',
  rca: { problem_statement: 'Fixed issue', investigation_data: '', root_causes: [] },
  action_plan: { description: 'Applied fix', owner: 'user-2', target_date: '2026-05-01' },
  timeline: { rca_due: '2026-04-15', action_due: '2026-05-01' },
  evidence_checklist: [],
  approvals: [],
  audit_trail: [],
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-05-05T00:00:00Z',
  created_by: 'user-1',
};

describe('CapaHistoryList', () => {
  it('should render closed CAPA records', () => {
    render(<CapaHistoryList closedCapas={[closedCapa]} onSelectCapa={jest.fn()} />);
    expect(screen.getByText('finding-456')).toBeInTheDocument();
  });

  it('should display closure date', () => {
    render(<CapaHistoryList closedCapas={[closedCapa]} onSelectCapa={jest.fn()} />);
    expect(screen.getByText(/2026-05-05/)).toBeInTheDocument();
  });

  it('should show empty state when no closed CAPAs', () => {
    render(<CapaHistoryList closedCapas={[]} onSelectCapa={jest.fn()} />);
    expect(screen.getByText(/no closed CAPA records/i)).toBeInTheDocument();
  });
});
```

### Step 4.2: Run test to verify it fails

- [ ] Run: `npm test -- tests/components/CapaHistoryList.test.tsx`
- [ ] Expected: FAIL

### Step 4.3: Create CapaHistoryList component

- [ ] Create `src/components/CapaHistoryList.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { CapaWorkflow } from '../types/capa';

interface CapaHistoryListProps {
  closedCapas: CapaWorkflow[];
  onSelectCapa: (capa: CapaWorkflow) => void;
}

export const CapaHistoryList: React.FC<CapaHistoryListProps> = ({ closedCapas, onSelectCapa }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredCapas = useMemo(() => {
    return closedCapas.filter(capa => {
      const matchesSearch = !searchTerm || 
        capa.finding_id.includes(searchTerm) || 
        capa.rca.problem_statement.includes(searchTerm);
      const matchesDate = !dateFilter || capa.updated_at.startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [closedCapas, searchTerm, dateFilter]);

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Search finding ID or problem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-slate-800 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Finding ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Root Cause</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Closed Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Days to Close</th>
            </tr>
          </thead>
          <tbody>
            {filteredCapas.map((capa) => {
              const daysToClose = Math.ceil(
                (new Date(capa.updated_at).getTime() - new Date(capa.created_at).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              return (
                <tr
                  key={capa.id}
                  onClick={() => onSelectCapa(capa)}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.finding_id}</td>
                  <td className="px-4 py-3 text-sm dark:text-gray-300 max-w-xs truncate">
                    {capa.rca.root_causes[0]?.description || 'Not specified'}
                  </td>
                  <td className="px-4 py-3 text-sm dark:text-gray-300">
                    {new Date(capa.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm dark:text-gray-300">{daysToClose} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredCapas.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No closed CAPA records found
        </div>
      )}
    </div>
  );
};
```

### Step 4.4: Run test to verify it passes

- [ ] Run: `npm test -- tests/components/CapaHistoryList.test.tsx`
- [ ] Expected: PASS

### Step 4.5: Commit

- [ ] Git add & commit:

```bash
git add src/components/CapaHistoryList.tsx tests/components/CapaHistoryList.test.tsx
git commit -m "feat: create CAPA history tab with search and date filtering"
```

---

## Task 5: State Machine Validation & Approval Gates

**Files:**
- Create: `src/lib/capa-utils.ts`
- Create: `tests/lib/capa-utils.test.ts`

**Note:** This task requires Claude Sonnet for state machine judgment logic.

### Step 5.1: Write tests for state transitions

- [ ] Create `tests/lib/capa-utils.test.ts`:

```typescript
import { 
  canTransitionTo, 
  isCapaComplete, 
  validateApprovals,
  validateEvidenceChecklist,
} from '../src/lib/capa-utils';
import { CapaWorkflow } from '../src/types/capa';

const mockCapa: CapaWorkflow = {
  id: 'capa-1',
  finding_id: 'finding-123',
  framework: 'ISO27001',
  type: 'corrective',
  status: 'draft',
  rca: {
    problem_statement: 'SSH keys exposed',
    investigation_data: 'Found in logs',
    root_causes: [{ description: 'Insufficient log filtering', evidence_urls: [] }],
  },
  action_plan: {
    description: 'Implement log redaction',
    owner: 'user-1',
    target_date: '2026-06-15',
  },
  timeline: {
    rca_due: '2026-06-05',
    action_due: '2026-06-15',
  },
  evidence_checklist: [
    { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
  ],
  approvals: [
    { role: 'implementer', user: 'user-1', approved: true },
    { role: 'reviewer', user: 'user-2', approved: true },
  ],
  audit_trail: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  created_by: 'user-1',
};

describe('CAPA State Machine', () => {
  it('should allow transition from draft to rca_pending', () => {
    expect(canTransitionTo(mockCapa, 'rca_pending')).toBe(true);
  });

  it('should not allow transition to plan_approved without RCA', () => {
    const capaWithoutRca = { ...mockCapa, status: 'draft' as const, rca: { ...mockCapa.rca, root_causes: [] } };
    expect(canTransitionTo(capaWithoutRca, 'plan_approved')).toBe(false);
  });

  it('should not allow transition to closed without all approvals', () => {
    const capaNoApproval = {
      ...mockCapa,
      approvals: [
        { role: 'implementer' as const, user: 'user-1', approved: false },
        { role: 'reviewer' as const, user: '', approved: false },
      ],
    };
    expect(canTransitionTo(capaNoApproval, 'closed')).toBe(false);
  });

  it('should validate complete CAPA for closure', () => {
    expect(isCapaComplete(mockCapa)).toBe(true);
  });

  it('should validate approval requirements', () => {
    expect(validateApprovals(mockCapa)).toBe(true);
  });

  it('should validate evidence checklist completion', () => {
    expect(validateEvidenceChecklist(mockCapa)).toBe(true);
  });

  it('should reject closure with incomplete evidence', () => {
    const capaIncompleteEvidence = {
      ...mockCapa,
      evidence_checklist: [
        { item: 'Test results', required: true, completed: false, evidence_urls: [] },
      ],
    };
    expect(isCapaComplete(capaIncompleteEvidence)).toBe(false);
  });
});
```

### Step 5.2: Run test to verify it fails

- [ ] Run: `npm test -- tests/lib/capa-utils.test.ts`
- [ ] Expected: FAIL with "cannot find module"

### Step 5.3: Create state machine utilities

- [ ] Create `src/lib/capa-utils.ts`:

```typescript
import { CapaWorkflow, CapaStatus } from '../types/capa';

// State machine: valid transitions
const VALID_TRANSITIONS: Record<CapaStatus, CapaStatus[]> = {
  draft: ['rca_pending'],
  rca_pending: ['rca_completed', 'draft'],
  rca_completed: ['plan_approved', 'rca_pending'],
  plan_approved: ['implementing', 'rca_completed'],
  implementing: ['verification_pending', 'plan_approved'],
  verification_pending: ['closed', 'implementing'],
  closed: [], // Terminal state
};

/**
 * Check if transition from current status to target status is valid
 */
export function canTransitionTo(capa: CapaWorkflow, targetStatus: CapaStatus): boolean {
  // Check if transition is allowed in state machine
  if (!VALID_TRANSITIONS[capa.status]?.includes(targetStatus)) {
    return false;
  }

  // Enforce gates for specific transitions
  switch (targetStatus) {
    case 'rca_completed':
      // Require problem statement and at least one root cause
      if (!capa.rca.problem_statement || capa.rca.root_causes.length === 0) {
        return false;
      }
      return true;

    case 'plan_approved':
      // Require RCA complete + action plan with owner and date
      if (capa.status !== 'rca_completed' && capa.status !== 'rca_pending') {
        return false;
      }
      if (!capa.action_plan.description || !capa.action_plan.owner || !capa.action_plan.target_date) {
        return false;
      }
      return true;

    case 'closed':
      // Require all approvals + evidence complete
      if (!validateApprovals(capa)) {
        return false;
      }
      if (!validateEvidenceChecklist(capa)) {
        return false;
      }
      return true;

    default:
      return true;
  }
}

/**
 * Validate that all required approvals are signed
 */
export function validateApprovals(capa: CapaWorkflow): boolean {
  const implementerApproved = capa.approvals.some(a => a.role === 'implementer' && a.approved);
  const reviewerApproved = capa.approvals.some(a => a.role === 'reviewer' && a.approved);
  return implementerApproved && reviewerApproved;
}

/**
 * Validate that all required evidence items are complete
 */
export function validateEvidenceChecklist(capa: CapaWorkflow): boolean {
  const requiredItems = capa.evidence_checklist.filter(item => item.required);
  if (requiredItems.length === 0) return true; // No required items
  return requiredItems.every(item => item.completed && item.evidence_urls.length > 0);
}

/**
 * Check if CAPA is complete (all sections filled, all gates passed)
 */
export function isCapaComplete(capa: CapaWorkflow): boolean {
  // RCA required
  if (!capa.rca.problem_statement || capa.rca.root_causes.length === 0) {
    return false;
  }

  // Action plan required
  if (!capa.action_plan.description || !capa.action_plan.owner || !capa.action_plan.target_date) {
    return false;
  }

  // All approvals required
  if (!validateApprovals(capa)) {
    return false;
  }

  // Evidence checklist required
  if (!validateEvidenceChecklist(capa)) {
    return false;
  }

  return true;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: CapaStatus): string {
  const labels: Record<CapaStatus, string> = {
    draft: 'Draft',
    rca_pending: 'RCA Pending',
    rca_completed: 'RCA Complete',
    plan_approved: 'Plan Approved',
    implementing: 'Implementing',
    verification_pending: 'Awaiting Verification',
    closed: 'Closed',
  };
  return labels[status];
}

/**
 * Calculate days until target date
 */
export function getDaysUntilDue(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if CAPA is overdue
 */
export function isOverdue(targetDate: string): boolean {
  return getDaysUntilDue(targetDate) < 0;
}
```

### Step 5.4: Run test to verify it passes

- [ ] Run: `npm test -- tests/lib/capa-utils.test.ts`
- [ ] Expected: PASS

### Step 5.5: Commit

- [ ] Git add & commit:

```bash
git add src/lib/capa-utils.ts tests/lib/capa-utils.test.ts
git commit -m "feat: add CAPA state machine with validation and approval gates"
```

---

## Task 6: Audit Trail Integration

**Files:**
- Modify: `src/hooks/useStore.tsx` (audit trail logging in CAPA actions)

### Step 6.1: Write test for audit trail logging

- [ ] Add test to `tests/integration/capa.test.ts`:

```typescript
import { useStore } from '../src/hooks/useStore';
import { CapaWorkflow } from '../src/types/capa';

describe('CAPA Audit Trail', () => {
  it('should log CAPA creation in audit trail', () => {
    const { state, dispatch } = useStore();
    const newCapa: CapaWorkflow = {
      id: 'capa-1',
      finding_id: 'finding-123',
      framework: 'ISO27001',
      type: 'corrective',
      status: 'draft',
      rca: { problem_statement: '', investigation_data: '', root_causes: [] },
      action_plan: { description: '', owner: '', target_date: '' },
      timeline: { rca_due: '', action_due: '' },
      evidence_checklist: [],
      approvals: [],
      audit_trail: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
    };

    dispatch({ type: 'CREATE_CAPA', payload: newCapa });
    const capa = state.capas?.find(c => c.id === 'capa-1');
    
    expect(capa?.audit_trail).toHaveLength(1);
    expect(capa?.audit_trail[0].action).toBe('created');
    expect(capa?.audit_trail[0].immutable).toBe(true);
  });

  it('should log status changes in audit trail', () => {
    const { state, dispatch } = useStore();
    
    // Create CAPA first
    const newCapa: CapaWorkflow = {
      id: 'capa-2',
      finding_id: 'finding-456',
      framework: 'ISO27001',
      type: 'corrective',
      status: 'draft',
      rca: { problem_statement: 'Test', investigation_data: '', root_causes: [{ description: 'Test', evidence_urls: [] }] },
      action_plan: { description: '', owner: '', target_date: '' },
      timeline: { rca_due: '', action_due: '' },
      evidence_checklist: [],
      approvals: [
        { role: 'implementer', user: '', approved: false },
        { role: 'reviewer', user: '', approved: false },
      ],
      audit_trail: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
    };

    dispatch({ type: 'CREATE_CAPA', payload: newCapa });

    // Update status
    dispatch({
      type: 'UPDATE_CAPA',
      payload: {
        id: 'capa-2',
        updates: { status: 'rca_pending' as const },
      },
    });

    const capa = state.capas?.find(c => c.id === 'capa-2');
    expect(capa?.audit_trail.length).toBeGreaterThan(1);
    expect(capa?.audit_trail[capa.audit_trail.length - 1].action).toBe('updated');
  });
});
```

### Step 6.2: Run test to verify it passes

- [ ] Run: `npm test -- tests/integration/capa.test.ts`
- [ ] Expected: PASS (audit trail logging already implemented in Task 1 reducer)

### Step 6.3: Verify audit trail immutability in useStore

- [ ] Confirm in `src/hooks/useStore.tsx` that all audit trail entries have `immutable: true` and are appended (never modified)
- [ ] No changes needed if already implemented correctly in Task 1

### Step 6.4: Commit

- [ ] Git add & commit:

```bash
git add tests/integration/capa.test.ts
git commit -m "feat: add audit trail integration tests for CAPA mutations"
```

---

## Task 7: Unit & Integration Tests

**Files:**
- Create: `src/components/CapaAndMonitoringTab.tsx` (main tab container)
- Create: `tests/components/CapaAndMonitoringTab.test.tsx`
- Create/Modify: `tests/integration/capa-full.test.ts` (full integration tests)

### Step 7.1: Create CapaAndMonitoringTab component

- [ ] Create `src/components/CapaAndMonitoringTab.tsx`:

```typescript
import React, { useState } from 'react';
import { CapaWorkflow } from '../types/capa';
import { ActiveCapaList } from './ActiveCapaList';
import { CapaHistoryList } from './CapaHistoryList';
import { CapaDetailPanel } from './CapaDetailPanel';

interface CapaAndMonitoringTabProps {
  capas: CapaWorkflow[];
  onCreateCapa: (capa: CapaWorkflow) => void;
  onUpdateCapa: (id: string, updates: Partial<CapaWorkflow>) => void;
  onCloseCapa: (id: string) => void;
}

export const CapaAndMonitoringTab: React.FC<CapaAndMonitoringTabProps> = ({
  capas,
  onCreateCapa,
  onUpdateCapa,
  onCloseCapa,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'monitoring'>('active');
  const [selectedCapa, setSelectedCapa] = useState<CapaWorkflow | null>(null);

  const activeCapa = capas.filter(c => c.status !== 'closed');
  const closedCapa = capas.filter(c => c.status === 'closed');

  const handleSave = (capa: CapaWorkflow) => {
    onUpdateCapa(capa.id, capa);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Active CAPA Workflows
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          CAPA History
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'monitoring'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Continuous Monitoring (Phase 6B)
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ActiveCapaList capas={activeCapa} onSelectCapa={setSelectedCapa} />
            </div>
            {selectedCapa && (
              <div>
                <CapaDetailPanel capa={selectedCapa} onSave={handleSave} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CapaHistoryList closedCapas={closedCapa} onSelectCapa={setSelectedCapa} />
            </div>
            {selectedCapa && selectedCapa.status === 'closed' && (
              <div>
                <CapaDetailPanel capa={selectedCapa} onSave={handleSave} readonly={true} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>Continuous Monitoring dashboard coming in Phase 6B</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Step 7.2: Write comprehensive integration test

- [ ] Create `tests/integration/capa-full.test.ts`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CapaAndMonitoringTab } from '../src/components/CapaAndMonitoringTab';
import { CapaWorkflow } from '../src/types/capa';

const mockCapas: CapaWorkflow[] = [];

describe('CAPA Full Integration', () => {
  it('should render CAPA & Monitoring tab with all sub-tabs', () => {
    render(
      <CapaAndMonitoringTab
        capas={mockCapas}
        onCreateCapa={jest.fn()}
        onUpdateCapa={jest.fn()}
        onCloseCapa={jest.fn()}
      />
    );
    expect(screen.getByText('Active CAPA Workflows')).toBeInTheDocument();
    expect(screen.getByText('CAPA History')).toBeInTheDocument();
    expect(screen.getByText(/Continuous Monitoring/)).toBeInTheDocument();
  });

  it('should show active and closed CAPAs in respective tabs', () => {
    const activeCapa: CapaWorkflow = {
      id: 'capa-active',
      finding_id: 'finding-1',
      framework: 'ISO27001',
      type: 'corrective',
      status: 'rca_pending',
      rca: { problem_statement: 'Active issue', investigation_data: '', root_causes: [] },
      action_plan: { description: '', owner: 'user-1', target_date: '2026-06-15' },
      timeline: { rca_due: '2026-06-05', action_due: '2026-06-15' },
      evidence_checklist: [],
      approvals: [],
      audit_trail: [],
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
      created_by: 'user-1',
    };

    const closedCapa: CapaWorkflow = {
      ...activeCapa,
      id: 'capa-closed',
      finding_id: 'finding-2',
      status: 'closed',
    };

    render(
      <CapaAndMonitoringTab
        capas={[activeCapa, closedCapa]}
        onCreateCapa={jest.fn()}
        onUpdateCapa={jest.fn()}
        onCloseCapa={jest.fn()}
      />
    );

    expect(screen.getByText('finding-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('CAPA History'));
    expect(screen.getByText('finding-2')).toBeInTheDocument();
  });

  it('should call onUpdateCapa when CAPA is saved', () => {
    const onUpdate = jest.fn();
    const capa: CapaWorkflow = {
      id: 'capa-1',
      finding_id: 'finding-1',
      framework: 'ISO27001',
      type: 'corrective',
      status: 'draft',
      rca: { problem_statement: 'Test issue', investigation_data: '', root_causes: [] },
      action_plan: { description: 'Fix it', owner: 'user-1', target_date: '2026-06-15' },
      timeline: { rca_due: '2026-06-05', action_due: '2026-06-15' },
      evidence_checklist: [],
      approvals: [],
      audit_trail: [],
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
      created_by: 'user-1',
    };

    render(
      <CapaAndMonitoringTab
        capas={[capa]}
        onCreateCapa={jest.fn()}
        onUpdateCapa={onUpdate}
        onCloseCapa={jest.fn()}
      />
    );

    // Click to select CAPA
    fireEvent.click(screen.getByText('finding-1'));

    // Update and save
    const problemInput = screen.getByDisplayValue('Test issue');
    fireEvent.change(problemInput, { target: { value: 'Updated issue' } });

    fireEvent.click(screen.getByText('Save Changes'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

### Step 7.3: Run all tests

- [ ] Run: `npm test`
- [ ] Expected: All tests pass (all 7 tasks)

### Step 7.4: Run build

- [ ] Run: `npm run build`
- [ ] Expected: Build succeeds with zero errors

### Step 7.5: Commit

- [ ] Git add & commit:

```bash
git add src/components/CapaAndMonitoringTab.tsx tests/components/CapaAndMonitoringTab.test.tsx tests/integration/capa-full.test.ts
git commit -m "feat: add CAPA & Monitoring main tab with full integration tests"
```

---

## Success Criteria

- [x] Design spec approved (`docs/superpowers/specs/2026-06-01-phase6-capa-design.md`)
- [x] Task cost analysis approved (`docs/superpowers/plans/2026-06-01-phase6-task-cost-analysis.md`)
- [ ] All 7 tasks completed with TDD (write test → implement → test passes → commit)
- [ ] All tests passing (target: 50+ tests, 100% pass rate)
- [ ] Build succeeds with zero errors
- [ ] Zero regressions in Phase 2/4/5 functionality
- [ ] All 7 commits pushed to GitHub with descriptive messages
- [ ] Phase 6A production-ready (4-5 hours implementation)

---

## Execution Instructions

**For Subagent-Driven Development:**

1. **Fresh subagent per task** (7 subagents total)
2. **Model assignment:**
   - Tasks 1-4, 6-7: Qwen2.5-coder-1.5B (mechanical)
   - Task 5: Claude Sonnet (state machine judgment)
3. **Two-stage review per task:**
   - Stage 1: Spec compliance (does code match spec requirements?)
   - Stage 2: Code quality (tests, coverage, Phase 5 patterns, no regressions?)
4. **TDD approach:** Write failing test → implement minimal code → test passes → commit
5. **Commit per task** with descriptive messages

**Expected Timeline:** 4-5 hours wall-clock time (all tasks completed in parallel by subagents)

**Next Step:** Dispatch first subagent for Task 1 (CapaWorkflow entity + useStore actions)
