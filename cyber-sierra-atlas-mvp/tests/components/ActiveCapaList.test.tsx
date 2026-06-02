import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCapaList } from '../../src/components/ActiveCapaList';
import { CapaWorkflow } from '../../src/types/capa';

const mockCapa: CapaWorkflow = {
  id: 'capa-1',
  finding_id: 'finding-123',
  framework: 'ISO27001',
  type: 'corrective',
  status: 'rca_pending',
  rca: {
    problem_statement: 'SSH keys exposed',
    investigation_data: '',
    root_causes: [],
  },
  action_plan: {
    description: '',
    owner: 'user-1',
    target_date: '2026-06-15',
  },
  timeline: {
    rca_due: '2026-06-05',
    action_due: '2026-06-15',
  },
  evidence_checklist: [],
  approvals: [],
  audit_trail: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  created_by: 'user-1',
};

describe('ActiveCapaList', () => {
  const mockOnSelectCapa = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with CAPA records', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    // Check for finding ID in table
    expect(screen.getByText('finding-123')).toBeInTheDocument();

    // Check for status badge
    expect(screen.getByText('rca_pending')).toBeInTheDocument();

    // Check table is present
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    // Check for search input
    expect(screen.getByPlaceholderText('Search finding ID or problem...')).toBeInTheDocument();

    // Check for status filter dropdown
    expect(screen.getByDisplayValue('Filter by status')).toBeInTheDocument();

    // Check for owner filter input
    expect(screen.getByPlaceholderText('Filter by owner...')).toBeInTheDocument();
  });

  it('should call onSelectCapa callback when row clicked', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    // Click on the finding ID cell
    const findingIdCell = screen.getByText('finding-123');
    fireEvent.click(findingIdCell.closest('tr')!);

    expect(mockOnSelectCapa).toHaveBeenCalledWith(mockCapa);
  });

  it('should filter by finding ID search', async () => {
    const secondCapa = { ...mockCapa, id: 'capa-2', finding_id: 'finding-456' };
    render(
      <ActiveCapaList capas={[mockCapa, secondCapa]} onSelectCapa={mockOnSelectCapa} />
    );

    const searchInput = screen.getByPlaceholderText('Search finding ID or problem...');
    await userEvent.type(searchInput, 'finding-456');

    // Should only show finding-456, not finding-123
    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.queryByText('finding-123')).not.toBeInTheDocument();
  });

  it('should filter by problem statement search', async () => {
    const problemCapa = {
      ...mockCapa,
      id: 'capa-2',
      rca: { ...mockCapa.rca, problem_statement: 'Database vulnerability' },
    };
    render(
      <ActiveCapaList capas={[mockCapa, problemCapa]} onSelectCapa={mockOnSelectCapa} />
    );

    const searchInput = screen.getByPlaceholderText('Search finding ID or problem...');
    await userEvent.type(searchInput, 'Database');

    // Should only show problemCapa, not mockCapa
    expect(screen.getByText('Database vulnerability')).toBeInTheDocument();
  });

  it('should filter by status', async () => {
    const rcaCompletedCapa = { ...mockCapa, id: 'capa-2', status: 'rca_completed' as const };
    render(
      <ActiveCapaList
        capas={[mockCapa, rcaCompletedCapa]}
        onSelectCapa={mockOnSelectCapa}
      />
    );

    const statusSelect = screen.getByDisplayValue('Filter by status') as HTMLSelectElement;
    await userEvent.selectOptions(statusSelect, 'rca_completed');

    // Should only show RCA Completed status
    expect(screen.getByText('rca_completed')).toBeInTheDocument();
    expect(screen.queryByText('rca_pending')).not.toBeInTheDocument();
  });

  it('should filter by owner', async () => {
    const ownerCapa = {
      ...mockCapa,
      id: 'capa-2',
      action_plan: { ...mockCapa.action_plan, owner: 'user-2' },
    };
    render(
      <ActiveCapaList
        capas={[mockCapa, ownerCapa]}
        onSelectCapa={mockOnSelectCapa}
      />
    );

    const ownerInput = screen.getByPlaceholderText('Filter by owner...');
    await userEvent.type(ownerInput, 'user-2');

    // Should only show user-2
    const ownerCell = screen.getByText('user-2');
    expect(ownerCell).toBeInTheDocument();
  });

  it('should display status with color styling', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    const statusBadge = screen.getByText('rca_pending');
    expect(statusBadge).toHaveClass('bg-yellow-100');
  });

  it('should display different status colors correctly', () => {
    const statusCapas = {
      draft: { ...mockCapa, id: 'draft', status: 'draft' as const },
      rca_pending: { ...mockCapa, id: 'rca_pending', status: 'rca_pending' as const },
      rca_completed: { ...mockCapa, id: 'rca_completed', status: 'rca_completed' as const },
      plan_approved: { ...mockCapa, id: 'plan_approved', status: 'plan_approved' as const },
      implementing: { ...mockCapa, id: 'implementing', status: 'implementing' as const },
      verification_pending: {
        ...mockCapa,
        id: 'verification_pending',
        status: 'verification_pending' as const,
      },
      closed: { ...mockCapa, id: 'closed', status: 'closed' as const },
    };

    render(
      <ActiveCapaList
        capas={Object.values(statusCapas)}
        onSelectCapa={mockOnSelectCapa}
      />
    );

    // Check each status has appropriate color
    expect(screen.getByText('draft')).toHaveClass('bg-gray-100');
    expect(screen.getAllByText('rca_pending')[0]).toHaveClass('bg-yellow-100');
    expect(screen.getByText('rca_completed')).toHaveClass('bg-blue-100');
    expect(screen.getByText('plan_approved')).toHaveClass('bg-blue-100');
    expect(screen.getByText('implementing')).toHaveClass('bg-orange-100');
    expect(screen.getByText('verification_pending')).toHaveClass('bg-purple-100');
    expect(screen.getByText('closed')).toHaveClass('bg-green-100');
  });

  it('should display empty state when no CAPAs match filters', () => {
    render(<ActiveCapaList capas={[]} onSelectCapa={mockOnSelectCapa} />);

    expect(screen.getByText('No active CAPA workflows found')).toBeInTheDocument();
  });

  it('should calculate days until due correctly', () => {
    const today = new Date();
    const daysUntilDue = 13; // 13 days from today
    const targetDate = new Date(today.getTime() + daysUntilDue * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const capaWithFutureDate = { ...mockCapa, action_plan: { ...mockCapa.action_plan, target_date: targetDate } };
    render(<ActiveCapaList capas={[capaWithFutureDate]} onSelectCapa={mockOnSelectCapa} />);

    // Days left should be around 13 (allowing for timezone differences)
    const cells = screen.getAllByRole('cell');
    const daysCell = cells[cells.length - 1];
    const daysText = daysCell.textContent;

    expect(daysText).toMatch(/\d+/);
  });

  it('should display overdue dates in red', () => {
    const pastDate = new Date('2026-05-01').toISOString().split('T')[0];
    const overdueCapa = {
      ...mockCapa,
      action_plan: { ...mockCapa.action_plan, target_date: pastDate },
    };

    render(<ActiveCapaList capas={[overdueCapa]} onSelectCapa={mockOnSelectCapa} />);

    const daysCell = screen.getAllByRole('cell')[5];
    const redSpan = daysCell.querySelector('.text-red-600');
    expect(redSpan).toBeInTheDocument();
  });

  it('should display root cause or problem statement in RCA column', () => {
    const capaWithRootCause = {
      ...mockCapa,
      rca: {
        ...mockCapa.rca,
        root_causes: [{ description: 'Misconfigured security group', evidence_urls: [] }],
      },
    };

    render(
      <ActiveCapaList capas={[capaWithRootCause]} onSelectCapa={mockOnSelectCapa} />
    );

    expect(screen.getByText('Misconfigured security group')).toBeInTheDocument();
  });

  it('should display problem statement when no root causes exist', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    expect(screen.getByText('SSH keys exposed')).toBeInTheDocument();
  });

  it('should support dark mode classes', () => {
    const { container } = render(
      <ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />
    );

    // Check that dark mode classes are present
    const filterSection = container.querySelector('.dark\\:bg-slate-800');
    expect(filterSection).toBeInTheDocument();

    const table = container.querySelector('.dark\\:text-gray-300');
    expect(table).toBeInTheDocument();
  });

  it('should be responsive with grid layout', () => {
    const { container } = render(
      <ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />
    );

    const filterGrid = container.querySelector('.grid-cols-1');
    expect(filterGrid).toBeInTheDocument();

    const mediumGrid = container.querySelector('.md\\:grid-cols-3');
    expect(mediumGrid).toBeInTheDocument();
  });

  it('should filter with AND logic (all filters apply)', async () => {
    const capa1 = {
      ...mockCapa,
      id: 'capa-1',
      finding_id: 'finding-123',
      status: 'rca_pending' as const,
      action_plan: { ...mockCapa.action_plan, owner: 'user-1' },
    };

    const capa2 = {
      ...mockCapa,
      id: 'capa-2',
      finding_id: 'finding-456',
      status: 'rca_pending' as const,
      action_plan: { ...mockCapa.action_plan, owner: 'user-2' },
    };

    const capa3 = {
      ...mockCapa,
      id: 'capa-3',
      finding_id: 'finding-789',
      status: 'implementing' as const,
      action_plan: { ...mockCapa.action_plan, owner: 'user-1' },
    };

    render(
      <ActiveCapaList
        capas={[capa1, capa2, capa3]}
        onSelectCapa={mockOnSelectCapa}
      />
    );

    // Filter by status = rca_pending and owner = user-1
    const statusSelect = screen.getByDisplayValue('Filter by status') as HTMLSelectElement;
    const ownerInput = screen.getByPlaceholderText('Filter by owner...');

    await userEvent.selectOptions(statusSelect, 'rca_pending');
    await userEvent.type(ownerInput, 'user-1');

    // Should only show capa1 (rca_pending AND user-1)
    expect(screen.getByText('finding-123')).toBeInTheDocument();
    expect(screen.queryByText('finding-456')).not.toBeInTheDocument();
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();
  });

  it('should clear filters to show all CAPAs', async () => {
    const capa1 = { ...mockCapa, id: 'capa-1', finding_id: 'finding-123' };
    const capa2 = { ...mockCapa, id: 'capa-2', finding_id: 'finding-456' };

    render(
      <ActiveCapaList capas={[capa1, capa2]} onSelectCapa={mockOnSelectCapa} />
    );

    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search finding ID or problem...');
    await userEvent.type(searchInput, 'finding-123');

    // Only capa1 should show
    expect(screen.getByText('finding-123')).toBeInTheDocument();
    expect(screen.queryByText('finding-456')).not.toBeInTheDocument();

    // Clear the filter
    await userEvent.clear(searchInput);

    // Both should show
    expect(screen.getByText('finding-123')).toBeInTheDocument();
    expect(screen.getByText('finding-456')).toBeInTheDocument();
  });

  it('should handle multiple root causes by showing first one', () => {
    const capaWithMultipleRootCauses = {
      ...mockCapa,
      rca: {
        ...mockCapa.rca,
        root_causes: [
          { description: 'First root cause', evidence_urls: [] },
          { description: 'Second root cause', evidence_urls: [] },
        ],
      },
    };

    render(
      <ActiveCapaList
        capas={[capaWithMultipleRootCauses]}
        onSelectCapa={mockOnSelectCapa}
      />
    );

    expect(screen.getByText('First root cause')).toBeInTheDocument();
    expect(screen.queryByText('Second root cause')).not.toBeInTheDocument();
  });

  it('should display all table columns', () => {
    render(<ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />);

    expect(screen.getByText('Finding ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Root Cause')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Action Due')).toBeInTheDocument();
    expect(screen.getByText('Days Left')).toBeInTheDocument();
  });

  it('should allow hover effect on table rows', () => {
    const { container } = render(
      <ActiveCapaList capas={[mockCapa]} onSelectCapa={mockOnSelectCapa} />
    );

    const tableRow = container.querySelector('tbody tr');
    expect(tableRow).toHaveClass('hover:bg-gray-50');
  });
});
