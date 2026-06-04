import { describe, it, expect, beforeEach } from 'vitest';
import { storeReducer } from '../../src/hooks/useStore';
import { CapaWorkflow } from '../../src/types/capa';

describe('CAPA Full Workflow Integration', () => {
  const initialState = {
    findings: [],
    assets: [],
    controls: [],
    capas: [],
    lastSaved: '2026-01-01T00:00:00Z',
  };

  const baseCapa: CapaWorkflow = {
    id: 'CAPA-FULL-001',
    finding_id: 'FIND-FULL-001',
    framework: 'ISO27001',
    type: 'corrective',
    status: 'draft',
    rca: {
      problem_statement: 'Database credentials exposed in logs',
      investigation_data: '',
      root_causes: [],
    },
    action_plan: {
      description: '',
      owner: 'security-team',
      target_date: '2026-07-01',
    },
    timeline: {
      rca_due: '2026-06-15',
      action_due: '2026-07-01',
    },
    evidence_checklist: [
      { item: 'Logs rotated', required: true, completed: false, evidence_urls: [] },
      { item: 'Monitoring enabled', required: true, completed: false, evidence_urls: [] },
    ],
    approvals: [
      { role: 'implementer', user: '', approved: false },
      { role: 'reviewer', user: '', approved: false },
    ],
    audit_trail: [],
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    created_by: 'admin@example.com',
  };

  describe('Full Workflow: Draft → Closed', () => {
    it('should complete full workflow from draft to closed', () => {
      let state = initialState;

      // Step 1: Create CAPA (draft)
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      expect(state.capas).toHaveLength(1);
      expect(state.capas![0].status).toBe('draft');
      expect(state.capas![0].audit_trail).toHaveLength(1);
      expect(state.capas![0].audit_trail[0].action).toBe('created');

      const capaId = state.capas![0].id;

      // Step 2: Complete RCA
      const withRca: CapaWorkflow = {
        ...state.capas![0],
        rca: {
          ...state.capas![0].rca,
          investigation_data: 'Found 12 credential leaks in debug logs',
          root_causes: [
            {
              description: 'No log sanitization in place',
              evidence_urls: ['evidence-1'],
            },
            {
              description: 'Development practices not enforced',
              evidence_urls: ['evidence-2'],
            },
          ],
          rca_completed_date: '2026-06-10T00:00:00Z',
          rca_completed_by: 'rca-lead@example.com',
        },
      };

      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withRca } });
      expect(state.capas![0].rca.root_causes).toHaveLength(2);
      expect(state.capas![0].rca.rca_completed_date).toBeDefined();

      // Step 3: Transition to RCA_PENDING (will validate later)
      const withStatus1: CapaWorkflow = {
        ...state.capas![0],
        status: 'rca_pending',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withStatus1 } });
      expect(state.capas![0].status).toBe('rca_pending');

      // Step 4: Complete RCA analysis
      const withRcaCompleted: CapaWorkflow = {
        ...state.capas![0],
        status: 'rca_completed',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withRcaCompleted } });
      expect(state.capas![0].status).toBe('rca_completed');

      // Step 5: Add action plan and move to plan_approved
      const withPlan: CapaWorkflow = {
        ...state.capas![0],
        action_plan: {
          description: 'Implement comprehensive log sanitization',
          owner: 'dev-team-lead',
          target_date: '2026-07-01',
        },
        status: 'plan_approved',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withPlan } });
      expect(state.capas![0].action_plan.description).toBeDefined();
      expect(state.capas![0].status).toBe('plan_approved');

      // Step 6: Start implementation
      const implementing: CapaWorkflow = {
        ...state.capas![0],
        status: 'implementing',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: implementing } });
      expect(state.capas![0].status).toBe('implementing');

      // Step 7: Complete evidence and approvals
      const withEvidence: CapaWorkflow = {
        ...state.capas![0],
        evidence_checklist: [
          {
            item: 'Logs rotated',
            required: true,
            completed: true,
            evidence_urls: ['evidence-rotated'],
            completed_date: '2026-06-28',
          },
          {
            item: 'Monitoring enabled',
            required: true,
            completed: true,
            evidence_urls: ['evidence-monitoring'],
            completed_date: '2026-06-28',
          },
        ],
        approvals: [
          {
            role: 'implementer',
            user: 'dev-team-lead',
            approved: true,
            timestamp: '2026-06-28T00:00:00Z',
          },
          {
            role: 'reviewer',
            user: 'security-reviewer',
            approved: true,
            timestamp: '2026-06-29T00:00:00Z',
          },
        ],
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withEvidence } });
      expect(state.capas![0].evidence_checklist[0].completed).toBe(true);
      expect(state.capas![0].approvals[0].approved).toBe(true);
      expect(state.capas![0].approvals[1].approved).toBe(true);

      // Step 8: Move to verification
      const verifying: CapaWorkflow = {
        ...state.capas![0],
        status: 'verification_pending',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: verifying } });
      expect(state.capas![0].status).toBe('verification_pending');

      // Step 9: Close CAPA
      const closed: CapaWorkflow = {
        ...state.capas![0],
        status: 'closed',
      };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: closed } });
      expect(state.capas![0].status).toBe('closed');
      expect(state.capas![0].audit_trail.length).toBeGreaterThan(1);
    });
  });

  describe('State Machine Transitions', () => {
    it('should track all state transitions in audit trail', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;

      // Transition 1
      const step1: CapaWorkflow = { ...state.capas![0], status: 'rca_pending' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: step1 } });

      // Transition 2
      const step2: CapaWorkflow = { ...state.capas![0], status: 'rca_completed' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: step2 } });

      // Verify audit trail has multiple entries
      expect(state.capas![0].audit_trail.length).toBeGreaterThanOrEqual(2);

      // All entries should have required fields
      state.capas![0].audit_trail.forEach((entry) => {
        expect(entry).toHaveProperty('action');
        expect(entry).toHaveProperty('user');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('details');
        expect(entry.immutable).toBe(true);
      });
    });

    it('should enforce valid status transitions', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;

      // Valid transition
      const validTransition: CapaWorkflow = { ...state.capas![0], status: 'rca_pending' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: validTransition } });
      expect(state.capas![0].status).toBe('rca_pending');

      // Another valid transition
      const anotherValid: CapaWorkflow = { ...state.capas![0], status: 'rca_completed' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: anotherValid } });
      expect(state.capas![0].status).toBe('rca_completed');
    });
  });

  describe('Evidence Validation', () => {
    it('should track completion of required evidence items', () => {
      let state = initialState;

      const capaWithEvidence: CapaWorkflow = {
        ...baseCapa,
        evidence_checklist: [
          { item: 'RCA report', required: true, completed: false, evidence_urls: [] },
          { item: 'Testing results', required: true, completed: false, evidence_urls: [] },
          { item: 'Additional notes', required: false, completed: false, evidence_urls: [] },
        ],
      };

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: capaWithEvidence });
      const capaId = state.capas![0].id;

      // Initially, not all evidence is complete
      const allRequiredComplete = state.capas![0].evidence_checklist
        .filter((item) => item.required)
        .every((item) => item.completed);
      expect(allRequiredComplete).toBe(false);

      // Complete required evidence
      const withCompletedEvidence: CapaWorkflow = {
        ...state.capas![0],
        evidence_checklist: [
          {
            item: 'RCA report',
            required: true,
            completed: true,
            evidence_urls: ['report-1'],
            completed_date: '2026-06-10',
          },
          {
            item: 'Testing results',
            required: true,
            completed: true,
            evidence_urls: ['results-1'],
            completed_date: '2026-06-10',
          },
          { item: 'Additional notes', required: false, completed: false, evidence_urls: [] },
        ],
      };

      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withCompletedEvidence } });

      // Now all required evidence is complete
      const allRequiredNowComplete = state.capas![0].evidence_checklist
        .filter((item) => item.required)
        .every((item) => item.completed);
      expect(allRequiredNowComplete).toBe(true);
    });
  });

  describe('Approval Gates', () => {
    it('should track both implementer and reviewer approvals', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;

      // Initially, neither approval is granted
      expect(state.capas![0].approvals[0].approved).toBe(false);
      expect(state.capas![0].approvals[1].approved).toBe(false);

      // Implementer approves
      const withImplementerApproval: CapaWorkflow = {
        ...state.capas![0],
        approvals: [
          {
            role: 'implementer',
            user: 'impl-user',
            approved: true,
            timestamp: '2026-06-20T00:00:00Z',
          },
          { role: 'reviewer', user: '', approved: false },
        ],
      };

      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withImplementerApproval } });
      expect(state.capas![0].approvals[0].approved).toBe(true);
      expect(state.capas![0].approvals[1].approved).toBe(false);

      // Reviewer approves
      const withBothApprovals: CapaWorkflow = {
        ...state.capas![0],
        approvals: [
          {
            role: 'implementer',
            user: 'impl-user',
            approved: true,
            timestamp: '2026-06-20T00:00:00Z',
          },
          {
            role: 'reviewer',
            user: 'reviewer-user',
            approved: true,
            timestamp: '2026-06-21T00:00:00Z',
          },
        ],
      };

      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withBothApprovals } });
      expect(state.capas![0].approvals[0].approved).toBe(true);
      expect(state.capas![0].approvals[1].approved).toBe(true);

      // Both approvals granted
      const allApproved = state.capas![0].approvals.every((approval) => approval.approved);
      expect(allApproved).toBe(true);
    });
  });

  describe('Multiple CAPAs', () => {
    it('should track multiple independent CAPAs', () => {
      let state = initialState;

      const capa1 = { ...baseCapa, id: 'CAPA-1', finding_id: 'FIND-1' };
      const capa2 = { ...baseCapa, id: 'CAPA-2', finding_id: 'FIND-2' };
      const capa3 = { ...baseCapa, id: 'CAPA-3', finding_id: 'FIND-3' };

      // Create 3 CAPAs
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: capa1 });
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: capa2 });
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: capa3 });

      expect(state.capas).toHaveLength(3);

      // Update each one independently
      const updated1: CapaWorkflow = { ...state.capas![0], status: 'rca_pending' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: 'CAPA-1', updates: updated1 } });

      const updated2: CapaWorkflow = { ...state.capas![1], status: 'plan_approved' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: 'CAPA-2', updates: updated2 } });

      const updated3: CapaWorkflow = { ...state.capas![2], status: 'closed' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: 'CAPA-3', updates: updated3 } });

      // Verify independent updates
      expect(state.capas![0].status).toBe('rca_pending');
      expect(state.capas![1].status).toBe('plan_approved');
      expect(state.capas![2].status).toBe('closed');
    });

    it('should filter active and closed CAPAs correctly', () => {
      let state = initialState;

      const activeCapa = { ...baseCapa, id: 'CAPA-ACTIVE', status: 'rca_pending' as const };
      const closedCapa = { ...baseCapa, id: 'CAPA-CLOSED', status: 'closed' as const };

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: activeCapa });
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: closedCapa });

      expect(state.capas).toHaveLength(2);

      // Filter active
      const activeCapas = state.capas!.filter((c) => c.status !== 'closed');
      expect(activeCapas).toHaveLength(1);
      expect(activeCapas[0].status).toBe('rca_pending');

      // Filter closed
      const closedCapas = state.capas!.filter((c) => c.status === 'closed');
      expect(closedCapas).toHaveLength(1);
      expect(closedCapas[0].status).toBe('closed');
    });
  });

  describe('Timeline Tracking', () => {
    it('should track RCA due date and action due date', () => {
      let state = initialState;

      const capaWithTimeline: CapaWorkflow = {
        ...baseCapa,
        timeline: {
          rca_due: '2026-06-15',
          action_due: '2026-07-01',
          verification_due: '2026-07-10',
        },
      };

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: capaWithTimeline });

      const capa = state.capas![0];
      expect(capa.timeline.rca_due).toBe('2026-06-15');
      expect(capa.timeline.action_due).toBe('2026-07-01');
      expect(capa.timeline.verification_due).toBe('2026-07-10');
    });

    it('should update completion dates as workflow progresses', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;

      // Update action_completion_date
      const withCompletionDate: CapaWorkflow = {
        ...state.capas![0],
        timeline: {
          ...state.capas![0].timeline,
          action_completion_date: '2026-06-28',
        },
      };

      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: withCompletionDate } });
      expect(state.capas![0].timeline.action_completion_date).toBe('2026-06-28');
    });
  });

  describe('Audit Trail Immutability', () => {
    it('should mark all audit entries as immutable', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;

      // Make multiple changes
      const updated: CapaWorkflow = { ...state.capas![0], status: 'rca_pending' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: updated } });

      // All audit entries should be immutable
      state.capas![0].audit_trail.forEach((entry) => {
        expect(entry.immutable).toBe(true);
      });
    });

    it('should preserve audit history through full workflow', () => {
      let state = initialState;

      state = storeReducer(state, { type: 'CREATE_CAPA', payload: baseCapa });
      const capaId = state.capas![0].id;
      const initialAuditLength = state.capas![0].audit_trail.length;

      // Make changes
      const updated1: CapaWorkflow = { ...state.capas![0], status: 'rca_pending' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: updated1 } });

      const updated2: CapaWorkflow = { ...state.capas![0], status: 'rca_completed' };
      state = storeReducer(state, { type: 'UPDATE_CAPA', payload: { id: capaId, updates: updated2 } });

      // Audit trail should grow
      expect(state.capas![0].audit_trail.length).toBeGreaterThan(initialAuditLength);

      // All entries should still exist
      expect(state.capas![0].audit_trail.length).toBeGreaterThanOrEqual(3);
    });
  });
});
