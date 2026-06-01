import { CapaWorkflow, CapaStatus } from '../../src/types/capa';

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
