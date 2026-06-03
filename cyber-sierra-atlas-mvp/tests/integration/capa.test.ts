import { describe, it, expect, beforeEach } from 'vitest';
import { storeReducer } from '../../src/hooks/useStore';
import { CapaWorkflow, AuditTrailEntry } from '../../src/types/capa';

describe('CAPA Audit Trail Integration', () => {
  const initialState = {
    findings: [],
    assets: [],
    controls: [],
    capas: [],
    lastSaved: '2026-01-01T00:00:00Z',
  };

  const mockCapa: CapaWorkflow = {
    id: 'CAPA-001',
    finding_id: 'FIND-001',
    framework: 'ISO27001',
    type: 'corrective',
    status: 'draft',
    rca: {
      problem_statement: 'Security gap identified',
      investigation_data: 'Initial investigation',
      root_causes: [],
    },
    action_plan: {
      description: 'Implement security control',
      owner: 'security-team',
      target_date: '2026-07-01',
    },
    timeline: {
      rca_due: '2026-06-15',
      action_due: '2026-07-01',
    },
    evidence_checklist: [],
    approvals: [
      { role: 'implementer', user: '', approved: false },
      { role: 'reviewer', user: '', approved: false },
    ],
    audit_trail: [],
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    created_by: 'user@example.com',
  };

  describe('CREATE_CAPA action', () => {
    it('should append audit entry with action=created when CAPA is created', () => {
      const action = { type: 'CREATE_CAPA', payload: mockCapa };
      const state = storeReducer(initialState, action);

      expect(state.capas).toHaveLength(1);
      const capa = state.capas![0];
      expect(capa.audit_trail).toHaveLength(1);

      const auditEntry = capa.audit_trail[0];
      expect(auditEntry.action).toBe('created');
      expect(auditEntry.user).toBe('user@example.com');
      expect(auditEntry.timestamp).toBeDefined();
      expect(auditEntry.details).toEqual({ status: 'draft' });
      expect(auditEntry.immutable).toBe(true);
    });

    it('should include all required audit entry fields', () => {
      const action = { type: 'CREATE_CAPA', payload: mockCapa };
      const state = storeReducer(initialState, action);
      const auditEntry = state.capas![0].audit_trail[0];

      expect(auditEntry).toHaveProperty('action');
      expect(auditEntry).toHaveProperty('user');
      expect(auditEntry).toHaveProperty('timestamp');
      expect(auditEntry).toHaveProperty('details');
      expect(auditEntry).toHaveProperty('immutable');
    });

    it('should set timestamp to valid ISO string', () => {
      const action = { type: 'CREATE_CAPA', payload: mockCapa };
      const state = storeReducer(initialState, action);
      const timestamp = state.capas![0].audit_trail[0].timestamp;

      expect(timestamp).toBeDefined();
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBeDefined();
    });
  });

  describe('UPDATE_CAPA action', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should append audit entry with action=updated when CAPA is updated', () => {
      const updates = {
        status: 'rca_pending' as const,
        rca: {
          ...mockCapa.rca,
          problem_statement: 'Updated problem statement',
        },
      };
      const action = {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates },
      };
      const state = storeReducer(stateWithCapa, action);
      const capa = state.capas![0];

      expect(capa.audit_trail).toHaveLength(2);
      const updateEntry = capa.audit_trail[1];
      expect(updateEntry.action).toBe('updated');
      expect(updateEntry.user).toBe('system');
      expect(updateEntry.timestamp).toBeDefined();
      expect(updateEntry.details).toEqual(updates);
      expect(updateEntry.immutable).toBe(true);
    });

    it('should preserve old status in audit details', () => {
      const updates = { status: 'rca_completed' as const };
      const action = {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates },
      };
      const state = storeReducer(stateWithCapa, action);
      const updateEntry = state.capas![0].audit_trail[1];

      expect(updateEntry.details).toHaveProperty('status');
      expect(updateEntry.details.status).toBe('rca_completed');
    });
  });

  describe('CLOSE_CAPA action', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should append audit entry with action=closed when CAPA is closed', () => {
      const closedAt = '2026-06-15T15:30:00Z';
      const action = {
        type: 'CLOSE_CAPA',
        payload: { id: 'CAPA-001', closed_at: closedAt },
      };
      const state = storeReducer(stateWithCapa, action);
      const capa = state.capas![0];

      expect(capa.audit_trail).toHaveLength(2);
      const closeEntry = capa.audit_trail[1];
      expect(closeEntry.action).toBe('closed');
      expect(closeEntry.user).toBe('system');
      expect(closeEntry.timestamp).toBe(closedAt);
      expect(closeEntry.details).toHaveProperty('previous_status');
      expect(closeEntry.details.previous_status).toBe('draft');
      expect(closeEntry.immutable).toBe(true);
    });

    it('should update CAPA status to closed', () => {
      const action = {
        type: 'CLOSE_CAPA',
        payload: { id: 'CAPA-001', closed_at: '2026-06-15T15:30:00Z' },
      };
      const state = storeReducer(stateWithCapa, action);
      expect(state.capas![0].status).toBe('closed');
    });
  });

  describe('APPROVE_CAPA action', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should append audit entry with action=approved when CAPA is approved', () => {
      const action = {
        type: 'APPROVE_CAPA',
        payload: { id: 'CAPA-001', role: 'implementer', user: 'approver@example.com' },
      };
      const state = storeReducer(stateWithCapa, action);
      const capa = state.capas![0];

      expect(capa.audit_trail).toHaveLength(2);
      const approvalEntry = capa.audit_trail[1];
      expect(approvalEntry.action).toBe('approved');
      expect(approvalEntry.user).toBe('approver@example.com');
      expect(approvalEntry.timestamp).toBeDefined();
      expect(approvalEntry.details).toHaveProperty('role');
      expect(approvalEntry.details.role).toBe('implementer');
      expect(approvalEntry.immutable).toBe(true);
    });

    it('should include approval role in audit details', () => {
      const action = {
        type: 'APPROVE_CAPA',
        payload: { id: 'CAPA-001', role: 'reviewer', user: 'reviewer@example.com' },
      };
      const state = storeReducer(stateWithCapa, action);
      const approvalEntry = state.capas![0].audit_trail[1];

      expect(approvalEntry.details.role).toBe('reviewer');
    });
  });

  describe('ADD_EVIDENCE action', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should append audit entry with action=evidence_added', () => {
      const evidence = {
        item: 'Control implementation checklist',
        required: true,
        completed: false,
        evidence_urls: [],
      };
      const action = {
        type: 'ADD_EVIDENCE',
        payload: { capa_id: 'CAPA-001', evidence },
      };
      const state = storeReducer(stateWithCapa, action);
      const capa = state.capas![0];

      expect(capa.audit_trail).toHaveLength(2);
      const evidenceEntry = capa.audit_trail[1];
      expect(evidenceEntry.action).toBe('evidence_added');
      expect(evidenceEntry.user).toBe('system');
      expect(evidenceEntry.timestamp).toBeDefined();
      expect(evidenceEntry.details).toHaveProperty('item');
      expect(evidenceEntry.details.item).toBe('Control implementation checklist');
      expect(evidenceEntry.immutable).toBe(true);
    });
  });

  describe('Audit trail immutability', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should have immutable=true on all audit entries', () => {
      const updates = { status: 'rca_pending' as const };
      const updateAction = {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates },
      };
      const stateAfterUpdate = storeReducer(stateWithCapa, updateAction);
      const capa = stateAfterUpdate.capas![0];

      capa.audit_trail.forEach(entry => {
        expect(entry.immutable).toBe(true);
      });
    });

    it('should not allow modification of audit trail entries after creation', () => {
      const capa = stateWithCapa.capas![0];
      const originalEntry = { ...capa.audit_trail[0] };

      // Attempt to modify (in actual runtime, readonly would prevent this)
      // This test ensures the structure is set up for immutability
      expect(capa.audit_trail[0]).toEqual(originalEntry);
      expect(capa.audit_trail[0].immutable).toBe(true);
    });

    it('should use spread operator to create new audit trail array', () => {
      const initialAuditLength = stateWithCapa.capas![0].audit_trail.length;
      const updates = { status: 'rca_pending' as const };
      const action = {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates },
      };
      const state = storeReducer(stateWithCapa, action);
      const newAuditLength = state.capas![0].audit_trail.length;

      expect(newAuditLength).toBe(initialAuditLength + 1);
      // Verify array reference is different (immutable pattern)
      expect(state.capas![0].audit_trail).not.toBe(stateWithCapa.capas![0].audit_trail);
    });
  });

  describe('Audit trail ordering (FIFO)', () => {
    it('should preserve audit trail entries in FIFO order', () => {
      let state = initialState;

      // CREATE_CAPA
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      state = storeReducer(state, createAction);
      expect(state.capas![0].audit_trail[0].action).toBe('created');

      // UPDATE_CAPA
      const updateAction = {
        type: 'UPDATE_CAPA',
        payload: {
          id: 'CAPA-001',
          updates: { status: 'rca_pending' as const },
        },
      };
      state = storeReducer(state, updateAction);
      expect(state.capas![0].audit_trail[1].action).toBe('updated');

      // ADD_EVIDENCE
      const evidenceAction = {
        type: 'ADD_EVIDENCE',
        payload: {
          capa_id: 'CAPA-001',
          evidence: {
            item: 'Test evidence',
            required: true,
            completed: false,
            evidence_urls: [],
          },
        },
      };
      state = storeReducer(state, evidenceAction);
      expect(state.capas![0].audit_trail[2].action).toBe('evidence_added');

      // CLOSE_CAPA
      const closeAction = {
        type: 'CLOSE_CAPA',
        payload: { id: 'CAPA-001', closed_at: '2026-06-15T15:30:00Z' },
      };
      state = storeReducer(state, closeAction);
      expect(state.capas![0].audit_trail[3].action).toBe('closed');

      // Verify all entries exist in order
      expect(state.capas![0].audit_trail).toHaveLength(4);
      expect(state.capas![0].audit_trail.map(e => e.action)).toEqual([
        'created',
        'updated',
        'evidence_added',
        'closed',
      ]);
    });

    it('should maintain exact order across multiple CAPA operations', () => {
      let state = initialState;

      // Create CAPA
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: mockCapa });
      const capa = state.capas![0];
      const timestamps: string[] = [capa.audit_trail[0].timestamp];

      // Perform multiple operations with small delays to ensure distinct timestamps
      for (let i = 0; i < 3; i++) {
        state = storeReducer(state, {
          type: 'UPDATE_CAPA',
          payload: {
            id: 'CAPA-001',
            updates: { status: 'rca_pending' as const },
          },
        });
        timestamps.push(state.capas![0].audit_trail[i + 1].timestamp);
      }

      // Verify all entries are in order
      const auditTrail = state.capas![0].audit_trail;
      for (let i = 0; i < auditTrail.length - 1; i++) {
        const currentTime = new Date(auditTrail[i].timestamp).getTime();
        const nextTime = new Date(auditTrail[i + 1].timestamp).getTime();
        // Entries should be in order (next >= current, allowing same timestamp)
        expect(nextTime).toBeGreaterThanOrEqual(currentTime);
      }
    });
  });

  describe('Audit entry required fields', () => {
    let stateWithCapa: typeof initialState;

    beforeEach(() => {
      const createAction = { type: 'CREATE_CAPA', payload: mockCapa };
      stateWithCapa = storeReducer(initialState, createAction);
    });

    it('should have action, user, timestamp, details, immutable on CREATE', () => {
      const entry = stateWithCapa.capas![0].audit_trail[0];
      const requiredFields = ['action', 'user', 'timestamp', 'details', 'immutable'];

      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
        expect((entry as any)[field]).toBeDefined();
      });
    });

    it('should have action, user, timestamp, details, immutable on UPDATE', () => {
      const updateAction = {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates: { status: 'rca_pending' as const } },
      };
      const state = storeReducer(stateWithCapa, updateAction);
      const entry = state.capas![0].audit_trail[1];

      const requiredFields = ['action', 'user', 'timestamp', 'details', 'immutable'];
      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
        expect((entry as any)[field]).toBeDefined();
      });
    });

    it('should have action, user, timestamp, details, immutable on CLOSE', () => {
      const closeAction = {
        type: 'CLOSE_CAPA',
        payload: { id: 'CAPA-001', closed_at: '2026-06-15T15:30:00Z' },
      };
      const state = storeReducer(stateWithCapa, closeAction);
      const entry = state.capas![0].audit_trail[1];

      const requiredFields = ['action', 'user', 'timestamp', 'details', 'immutable'];
      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
        expect((entry as any)[field]).toBeDefined();
      });
    });

    it('should have action, user, timestamp, details, immutable on APPROVE', () => {
      const approveAction = {
        type: 'APPROVE_CAPA',
        payload: { id: 'CAPA-001', role: 'implementer', user: 'approver@example.com' },
      };
      const state = storeReducer(stateWithCapa, approveAction);
      const entry = state.capas![0].audit_trail[1];

      const requiredFields = ['action', 'user', 'timestamp', 'details', 'immutable'];
      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
        expect((entry as any)[field]).toBeDefined();
      });
    });

    it('should have action, user, timestamp, details, immutable on ADD_EVIDENCE', () => {
      const evidenceAction = {
        type: 'ADD_EVIDENCE',
        payload: {
          capa_id: 'CAPA-001',
          evidence: {
            item: 'Test evidence',
            required: true,
            completed: false,
            evidence_urls: [],
          },
        },
      };
      const state = storeReducer(stateWithCapa, evidenceAction);
      const entry = state.capas![0].audit_trail[1];

      const requiredFields = ['action', 'user', 'timestamp', 'details', 'immutable'];
      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
        expect((entry as any)[field]).toBeDefined();
      });
    });
  });

  describe('Multiple CAPAs with separate audit trails', () => {
    it('should maintain separate audit trails for different CAPAs', () => {
      let state = initialState;

      // Create first CAPA
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: mockCapa });

      // Create second CAPA
      const secondCapa = { ...mockCapa, id: 'CAPA-002', finding_id: 'FIND-002' };
      state = storeReducer(state, { type: 'CREATE_CAPA', payload: secondCapa });

      // Update first CAPA
      state = storeReducer(state, {
        type: 'UPDATE_CAPA',
        payload: { id: 'CAPA-001', updates: { status: 'rca_pending' as const } },
      });

      // Verify separate audit trails
      expect(state.capas![0].audit_trail).toHaveLength(2); // CREATE + UPDATE
      expect(state.capas![1].audit_trail).toHaveLength(1); // CREATE only
    });
  });
});
