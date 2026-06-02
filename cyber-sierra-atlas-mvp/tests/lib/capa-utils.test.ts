import {
  canTransitionTo,
  validateApprovals,
  validateEvidenceChecklist,
  isCapaComplete,
  getStatusLabel,
  getDaysUntilDue,
  isOverdue,
} from '../../src/lib/capa-utils';
import { CapaWorkflow } from '../../src/types/capa';

describe('CAPA Utils - State Machine Validation', () => {
  // Mock CAPA for testing
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
      { item: 'Documentation', required: false, completed: false, evidence_urls: [] },
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

  describe('canTransitionTo()', () => {
    describe('from draft status', () => {
      it('should allow draft to rca_pending (no gates)', () => {
        const capa = { ...mockCapa, status: 'draft' };
        expect(canTransitionTo(capa, 'rca_pending')).toBe(true);
      });

      it('should not allow draft to rca_completed (skip intermediate)', () => {
        const capa = { ...mockCapa, status: 'draft' };
        expect(canTransitionTo(capa, 'rca_completed')).toBe(false);
      });

      it('should not allow draft to plan_approved (skip multiple)', () => {
        const capa = { ...mockCapa, status: 'draft' };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(false);
      });

      it('should not allow draft to closed', () => {
        const capa = { ...mockCapa, status: 'draft' };
        expect(canTransitionTo(capa, 'closed')).toBe(false);
      });
    });

    describe('from rca_pending status', () => {
      it('should allow rca_pending to rca_completed with valid RCA', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_pending',
          rca: {
            problem_statement: 'SSH keys exposed',
            investigation_data: 'Found in logs',
            root_causes: [{ description: 'Insufficient log filtering', evidence_urls: [] }],
          },
        };
        expect(canTransitionTo(capa, 'rca_completed')).toBe(true);
      });

      it('should not allow rca_pending to rca_completed without problem_statement', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_pending',
          rca: {
            problem_statement: '',
            investigation_data: 'Found in logs',
            root_causes: [{ description: 'Root cause', evidence_urls: [] }],
          },
        };
        expect(canTransitionTo(capa, 'rca_completed')).toBe(false);
      });

      it('should not allow rca_pending to rca_completed without root_causes', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_pending',
          rca: {
            problem_statement: 'SSH keys exposed',
            investigation_data: 'Found in logs',
            root_causes: [],
          },
        };
        expect(canTransitionTo(capa, 'rca_completed')).toBe(false);
      });

      it('should not allow rca_pending to plan_approved (skip intermediate)', () => {
        const capa = { ...mockCapa, status: 'rca_pending' };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(false);
      });
    });

    describe('from rca_completed status', () => {
      it('should allow rca_completed to plan_approved with valid action plan', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_completed',
          action_plan: {
            description: 'Implement log redaction',
            owner: 'user-1',
            target_date: '2026-06-15',
          },
        };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(true);
      });

      it('should not allow rca_completed to plan_approved without action plan description', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_completed',
          action_plan: {
            description: '',
            owner: 'user-1',
            target_date: '2026-06-15',
          },
        };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(false);
      });

      it('should not allow rca_completed to plan_approved without action plan owner', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_completed',
          action_plan: {
            description: 'Implement log redaction',
            owner: '',
            target_date: '2026-06-15',
          },
        };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(false);
      });

      it('should not allow rca_completed to plan_approved without target date', () => {
        const capa = {
          ...mockCapa,
          status: 'rca_completed',
          action_plan: {
            description: 'Implement log redaction',
            owner: 'user-1',
            target_date: '',
          },
        };
        expect(canTransitionTo(capa, 'plan_approved')).toBe(false);
      });
    });

    describe('from plan_approved status', () => {
      it('should allow plan_approved to implementing (no extra gates)', () => {
        const capa = { ...mockCapa, status: 'plan_approved' };
        expect(canTransitionTo(capa, 'implementing')).toBe(true);
      });

      it('should not allow plan_approved to closed (skip intermediates)', () => {
        const capa = { ...mockCapa, status: 'plan_approved' };
        expect(canTransitionTo(capa, 'closed')).toBe(false);
      });
    });

    describe('from implementing status', () => {
      it('should allow implementing to verification_pending (no extra gates)', () => {
        const capa = { ...mockCapa, status: 'implementing' };
        expect(canTransitionTo(capa, 'verification_pending')).toBe(true);
      });
    });

    describe('from verification_pending status', () => {
      it('should allow verification_pending to closed with valid approvals and evidence', () => {
        const capa = {
          ...mockCapa,
          status: 'verification_pending',
          approvals: [
            { role: 'implementer', user: 'user-1', approved: true },
            { role: 'reviewer', user: 'user-2', approved: true },
          ],
          evidence_checklist: [
            { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
          ],
        };
        expect(canTransitionTo(capa, 'closed')).toBe(true);
      });

      it('should not allow verification_pending to closed without valid approvals', () => {
        const capa = {
          ...mockCapa,
          status: 'verification_pending',
          approvals: [
            { role: 'implementer', user: 'user-1', approved: false },
            { role: 'reviewer', user: 'user-2', approved: true },
          ],
          evidence_checklist: [
            { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
          ],
        };
        expect(canTransitionTo(capa, 'closed')).toBe(false);
      });

      it('should not allow verification_pending to closed without valid evidence', () => {
        const capa = {
          ...mockCapa,
          status: 'verification_pending',
          approvals: [
            { role: 'implementer', user: 'user-1', approved: true },
            { role: 'reviewer', user: 'user-2', approved: true },
          ],
          evidence_checklist: [
            { item: 'Test results', required: true, completed: true, evidence_urls: [] },
          ],
        };
        expect(canTransitionTo(capa, 'closed')).toBe(false);
      });
    });

    describe('from closed status', () => {
      it('should not allow closed to transition anywhere (terminal state)', () => {
        const capa = { ...mockCapa, status: 'closed' };
        expect(canTransitionTo(capa, 'draft')).toBe(false);
        expect(canTransitionTo(capa, 'rca_pending')).toBe(false);
        expect(canTransitionTo(capa, 'verification_pending')).toBe(false);
      });
    });

    describe('invalid transitions', () => {
      it('should not allow backwards transitions', () => {
        const capa = { ...mockCapa, status: 'plan_approved' };
        expect(canTransitionTo(capa, 'rca_pending')).toBe(false);
      });

      it('should not allow same status transition', () => {
        const capa = { ...mockCapa, status: 'draft' };
        expect(canTransitionTo(capa, 'draft')).toBe(false);
      });
    });
  });

  describe('validateApprovals()', () => {
    it('should return true when both implementer and reviewer approved', () => {
      const capa = {
        ...mockCapa,
        approvals: [
          { role: 'implementer', user: 'user-1', approved: true },
          { role: 'reviewer', user: 'user-2', approved: true },
        ],
      };
      expect(validateApprovals(capa)).toBe(true);
    });

    it('should return false when implementer not approved', () => {
      const capa = {
        ...mockCapa,
        approvals: [
          { role: 'implementer', user: 'user-1', approved: false },
          { role: 'reviewer', user: 'user-2', approved: true },
        ],
      };
      expect(validateApprovals(capa)).toBe(false);
    });

    it('should return false when reviewer not approved', () => {
      const capa = {
        ...mockCapa,
        approvals: [
          { role: 'implementer', user: 'user-1', approved: true },
          { role: 'reviewer', user: 'user-2', approved: false },
        ],
      };
      expect(validateApprovals(capa)).toBe(false);
    });

    it('should return false when implementer approval missing', () => {
      const capa = {
        ...mockCapa,
        approvals: [{ role: 'reviewer', user: 'user-2', approved: true }],
      };
      expect(validateApprovals(capa)).toBe(false);
    });

    it('should return false when reviewer approval missing', () => {
      const capa = {
        ...mockCapa,
        approvals: [{ role: 'implementer', user: 'user-1', approved: true }],
      };
      expect(validateApprovals(capa)).toBe(false);
    });

    it('should return false when both missing', () => {
      const capa = { ...mockCapa, approvals: [] };
      expect(validateApprovals(capa)).toBe(false);
    });

    it('should require AND logic: both roles must be approved', () => {
      const capaOneApproved = {
        ...mockCapa,
        approvals: [
          { role: 'implementer', user: 'user-1', approved: true },
          { role: 'reviewer', user: 'user-2', approved: false },
        ],
      };
      expect(validateApprovals(capaOneApproved)).toBe(false);
    });
  });

  describe('validateEvidenceChecklist()', () => {
    it('should return true when all required items are complete with URLs', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
          { item: 'Documentation', required: true, completed: true, evidence_urls: ['url2', 'url3'] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(true);
    });

    it('should return true when no required items', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Optional item', required: false, completed: false, evidence_urls: [] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(true);
    });

    it('should return true for empty checklist', () => {
      const capa = { ...mockCapa, evidence_checklist: [] };
      expect(validateEvidenceChecklist(capa)).toBe(true);
    });

    it('should return false when required item not completed', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test results', required: true, completed: false, evidence_urls: ['url1'] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(false);
    });

    it('should return false when required item has no URLs', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test results', required: true, completed: true, evidence_urls: [] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(false);
    });

    it('should return false when required item missing evidence_urls entirely', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          {
            item: 'Test results',
            required: true,
            completed: true,
            evidence_urls: [],
          },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(false);
    });

    it('should ignore optional items that are incomplete', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
          { item: 'Optional doc', required: false, completed: false, evidence_urls: [] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(true);
    });

    it('should validate multiple required items: all must be complete with URLs', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test 1', required: true, completed: true, evidence_urls: ['url1'] },
          { item: 'Test 2', required: true, completed: true, evidence_urls: ['url2'] },
          { item: 'Test 3', required: true, completed: false, evidence_urls: ['url3'] },
        ],
      };
      expect(validateEvidenceChecklist(capa)).toBe(false);
    });
  });

  describe('isCapaComplete()', () => {
    it('should return true for fully complete CAPA', () => {
      const capa = {
        ...mockCapa,
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
        approvals: [
          { role: 'implementer', user: 'user-1', approved: true },
          { role: 'reviewer', user: 'user-2', approved: true },
        ],
        evidence_checklist: [
          { item: 'Test results', required: true, completed: true, evidence_urls: ['url1'] },
        ],
      };
      expect(isCapaComplete(capa)).toBe(true);
    });

    it('should return false when RCA missing problem_statement', () => {
      const capa = {
        ...mockCapa,
        rca: {
          problem_statement: '',
          investigation_data: 'Found in logs',
          root_causes: [{ description: 'Root cause', evidence_urls: [] }],
        },
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when RCA missing root_causes', () => {
      const capa = {
        ...mockCapa,
        rca: {
          problem_statement: 'SSH keys exposed',
          investigation_data: 'Found in logs',
          root_causes: [],
        },
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when action_plan missing description', () => {
      const capa = {
        ...mockCapa,
        action_plan: {
          description: '',
          owner: 'user-1',
          target_date: '2026-06-15',
        },
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when action_plan missing owner', () => {
      const capa = {
        ...mockCapa,
        action_plan: {
          description: 'Implement log redaction',
          owner: '',
          target_date: '2026-06-15',
        },
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when action_plan missing target_date', () => {
      const capa = {
        ...mockCapa,
        action_plan: {
          description: 'Implement log redaction',
          owner: 'user-1',
          target_date: '',
        },
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when approvals incomplete', () => {
      const capa = {
        ...mockCapa,
        approvals: [
          { role: 'implementer', user: 'user-1', approved: false },
          { role: 'reviewer', user: 'user-2', approved: true },
        ],
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return false when evidence incomplete', () => {
      const capa = {
        ...mockCapa,
        evidence_checklist: [
          { item: 'Test results', required: true, completed: true, evidence_urls: [] },
        ],
      };
      expect(isCapaComplete(capa)).toBe(false);
    });

    it('should return true when all components valid', () => {
      expect(isCapaComplete(mockCapa)).toBe(true);
    });
  });

  describe('getStatusLabel()', () => {
    it('should return human-readable labels for all statuses', () => {
      expect(getStatusLabel('draft')).toBe('Draft');
      expect(getStatusLabel('rca_pending')).toBe('RCA Pending');
      expect(getStatusLabel('rca_completed')).toBe('RCA Completed');
      expect(getStatusLabel('plan_approved')).toBe('Plan Approved');
      expect(getStatusLabel('implementing')).toBe('Implementing');
      expect(getStatusLabel('verification_pending')).toBe('Verification Pending');
      expect(getStatusLabel('closed')).toBe('Closed');
    });
  });

  describe('getDaysUntilDue()', () => {
    it('should calculate positive days for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const days = getDaysUntilDue(futureDate.toISOString());
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(10);
    });

    it('should calculate negative days for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const days = getDaysUntilDue(pastDate.toISOString());
      expect(days).toBeLessThan(0);
    });

    it('should return 0 for today', () => {
      const today = new Date().toISOString();
      const days = getDaysUntilDue(today);
      expect(days).toBe(0);
    });

    it('should use Math.ceil for rounding', () => {
      // Create a date that's 1 day + 1 hour in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(futureDate.getHours() + 1);
      const days = getDaysUntilDue(futureDate.toISOString());
      // Should be 1 or 2 days depending on time of day
      expect(days).toBeGreaterThanOrEqual(1);
    });
  });

  describe('isOverdue()', () => {
    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      expect(isOverdue(futureDate.toISOString())).toBe(false);
    });

    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(isOverdue(pastDate.toISOString())).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isOverdue(today.toISOString())).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete workflow: draft -> closed', () => {
      let capa = {
        ...mockCapa,
        status: 'draft',
      };

      // Draft -> RCA Pending
      expect(canTransitionTo(capa, 'rca_pending')).toBe(true);
      capa = { ...capa, status: 'rca_pending' };

      // RCA Pending -> RCA Completed
      expect(canTransitionTo(capa, 'rca_completed')).toBe(true);
      capa = { ...capa, status: 'rca_completed' };

      // RCA Completed -> Plan Approved
      expect(canTransitionTo(capa, 'plan_approved')).toBe(true);
      capa = { ...capa, status: 'plan_approved' };

      // Plan Approved -> Implementing
      expect(canTransitionTo(capa, 'implementing')).toBe(true);
      capa = { ...capa, status: 'implementing' };

      // Implementing -> Verification Pending
      expect(canTransitionTo(capa, 'verification_pending')).toBe(true);
      capa = { ...capa, status: 'verification_pending' };

      // Verification Pending -> Closed
      expect(canTransitionTo(capa, 'closed')).toBe(true);
      capa = { ...capa, status: 'closed' };

      // Closed is terminal
      expect(canTransitionTo(capa, 'draft')).toBe(false);
    });

    it('should enforce gates during workflow', () => {
      // Start at rca_pending, try to skip to closed without gates
      const capa = {
        ...mockCapa,
        status: 'rca_pending',
        rca: {
          problem_statement: '',
          investigation_data: '',
          root_causes: [],
        },
      };

      // Cannot go to rca_completed without problem_statement
      expect(canTransitionTo(capa, 'rca_completed')).toBe(false);

      // Cannot jump to plan_approved
      expect(canTransitionTo(capa, 'plan_approved')).toBe(false);

      // Cannot reach closed
      expect(canTransitionTo(capa, 'closed')).toBe(false);

      // But can reach rca_pending -> rca_completed once data is valid
      const validRcaCapa = {
        ...capa,
        rca: {
          problem_statement: 'Valid problem',
          investigation_data: 'Investigation',
          root_causes: [{ description: 'Root cause', evidence_urls: [] }],
        },
      };
      expect(canTransitionTo(validRcaCapa, 'rca_completed')).toBe(true);
    });
  });
});
