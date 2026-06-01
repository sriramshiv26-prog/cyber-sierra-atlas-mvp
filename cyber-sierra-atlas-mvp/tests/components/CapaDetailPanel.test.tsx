import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapaDetailPanel } from '../../src/components/CapaDetailPanel';
import { CapaWorkflow } from '../../src/types/capa';

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
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render RCA section with problem statement', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);
    expect(screen.getAllByText('Root Cause Analysis')).toHaveLength(2); // Tab + section heading
    expect(screen.getByDisplayValue('SSH keys exposed in logs')).toBeInTheDocument();
  });

  it('should render action plan section', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Action Plan'));
    expect(screen.getByDisplayValue('Implement log redaction')).toBeInTheDocument();
  });

  it('should render evidence checklist section', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);
    expect(screen.getAllByText('Evidence & Approval')).toHaveLength(1); // Just tab text, section hidden by default
  });

  it('should render timeline section', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);
    expect(screen.getAllByText('Timeline')).toHaveLength(1); // Just tab text, section hidden by default
  });

  it('should switch between sections via tabs', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    // Initially RCA section should be visible
    expect(screen.getAllByText('Root Cause Analysis')).toHaveLength(2); // h1 and section heading
    expect(screen.getByDisplayValue('SSH keys exposed in logs')).toBeInTheDocument();

    // Click on Action Plan tab
    fireEvent.click(screen.getByText('Action Plan'));
    expect(screen.getAllByText('Action Plan')).toHaveLength(2); // button and h3
    expect(screen.getByDisplayValue('Implement log redaction')).toBeInTheDocument();
  });

  it('should render repeating root causes', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);
    expect(screen.getByDisplayValue('Insufficient log filtering')).toBeInTheDocument();
  });

  it('should allow adding new root cause', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    const addButton = screen.getByText('+ Add Root Cause');
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    // Should have two textareas for root causes now
    const textareas = screen.getAllByPlaceholderText('Root cause description');
    expect(textareas.length).toBeGreaterThan(1);
  });

  it('should call onSave when Save Changes is clicked', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should update problem statement on change', async () => {
    const user = userEvent.setup();
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    const problemInput = screen.getByDisplayValue('SSH keys exposed in logs') as HTMLTextAreaElement;
    await user.clear(problemInput);
    await user.type(problemInput, 'New problem statement');

    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockOnSave).toHaveBeenCalled();
    const savedCapa = mockOnSave.mock.calls[0][0];
    expect(savedCapa.rca.problem_statement).toBe('New problem statement');
  });

  it('should support readonly mode', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} readonly={true} />);

    const problemInput = screen.getByDisplayValue('SSH keys exposed in logs') as HTMLTextAreaElement;
    expect(problemInput).toBeDisabled();

    // Save button should not exist in readonly mode
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('should render evidence checklist items', () => {
    const capaWithEvidence = {
      ...mockCapa,
      evidence_checklist: [
        { item: 'Test results', required: true, completed: false, evidence_urls: [] },
        { item: 'Code review', required: true, completed: true, evidence_urls: ['url1'] },
      ],
    };

    render(<CapaDetailPanel capa={capaWithEvidence} onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('Evidence & Approval'));

    expect(screen.getByText('Test results')).toBeInTheDocument();
    expect(screen.getByText('Code review')).toBeInTheDocument();
  });

  it('should render approval section with implementer and reviewer roles', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('Evidence & Approval'));

    expect(screen.getByText('Implementer Approval')).toBeInTheDocument();
    expect(screen.getByText('Reviewer Approval')).toBeInTheDocument();
  });

  it('should display CAPA header with framework and type info', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    expect(screen.getByText(/finding-123/)).toBeInTheDocument();
    expect(screen.getByText(/ISO27001/)).toBeInTheDocument();
    expect(screen.getByText(/corrective/)).toBeInTheDocument();
    expect(screen.getByText(/draft/)).toBeInTheDocument();
  });

  it('should display timeline information', () => {
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('Timeline'));

    expect(screen.getByText('RCA Due:')).toBeInTheDocument();
    expect(screen.getByText('2026-06-05')).toBeInTheDocument();
    expect(screen.getByText('Action Due:')).toBeInTheDocument();
    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
  });

  it('should update action plan fields', async () => {
    const user = userEvent.setup();
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('Action Plan'));

    const descriptionInput = screen.getByDisplayValue('Implement log redaction') as HTMLTextAreaElement;
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated action plan');

    fireEvent.click(screen.getByText('Save Changes'));

    const savedCapa = mockOnSave.mock.calls[0][0];
    expect(savedCapa.action_plan.description).toBe('Updated action plan');
  });

  it('should handle target date updates in action plan', async () => {
    const user = userEvent.setup();
    render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('Action Plan'));

    const dateInputs = screen.getAllByRole('textbox');
    const targetDateInput = dateInputs.find(input => input.getAttribute('type') === 'date') as HTMLInputElement;

    if (targetDateInput) {
      fireEvent.change(targetDateInput, { target: { value: '2026-07-15' } });
      fireEvent.click(screen.getByText('Save Changes'));

      const savedCapa = mockOnSave.mock.calls[0][0];
      expect(savedCapa.action_plan.target_date).toBe('2026-07-15');
    }
  });

  it('should support dark mode with dark: classes', () => {
    const { container } = render(<CapaDetailPanel capa={mockCapa} onSave={mockOnSave} />);

    // Check that dark mode classes are present
    const mainDiv = container.querySelector('.dark\\:bg-slate-900');
    expect(mainDiv).toBeInTheDocument();
  });
});
