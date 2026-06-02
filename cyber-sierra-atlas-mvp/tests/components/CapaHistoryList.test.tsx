import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CapaHistoryList } from '../../src/components/CapaHistoryList';
import { CapaWorkflow } from '../../src/types/capa';

describe('CapaHistoryList', () => {
  const mockOnSelect = vi.fn();
  const closedCapa: CapaWorkflow = {
    id: 'capa-closed-1',
    finding_id: 'finding-456',
    framework: 'ISO27001',
    type: 'corrective',
    status: 'closed',
    rca: {
      problem_statement: 'Fixed issue',
      investigation_data: '',
      root_causes: [{ description: 'Database connection timeout', evidence_urls: [] }],
      rca_completed_date: '2026-04-15T00:00:00Z',
      rca_completed_by: 'user-1',
    },
    action_plan: {
      description: 'Applied fix',
      owner: 'user-2',
      target_date: '2026-05-01',
    },
    timeline: {
      rca_due: '2026-04-15',
      action_due: '2026-05-01',
      action_completion_date: '2026-05-05T00:00:00Z',
    },
    evidence_checklist: [],
    approvals: [],
    audit_trail: [],
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-05-05T00:00:00Z',
    created_by: 'user-1',
  };

  const closedCapa2: CapaWorkflow = {
    id: 'capa-closed-2',
    finding_id: 'finding-789',
    framework: 'NIST',
    type: 'preventive',
    status: 'closed',
    rca: {
      problem_statement: 'Preventive measure implemented',
      investigation_data: '',
      root_causes: [],
    },
    action_plan: {
      description: 'Prevention measures',
      owner: 'user-3',
      target_date: '2026-06-01',
    },
    timeline: {
      rca_due: '2026-05-15',
      action_due: '2026-06-01',
    },
    evidence_checklist: [],
    approvals: [],
    audit_trail: [],
    created_at: '2026-05-10T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
    created_by: 'user-1',
  };

  it('renders closed CAPA records with finding IDs', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.getByText('finding-789')).toBeInTheDocument();
  });

  it('displays closure date from updated_at field', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa]}
        onSelectCapa={mockOnSelect}
      />
    );

    // Check for the formatted date (will depend on locale, but should contain the date)
    const dateElements = screen.getAllByText(/5\/5\/2026|05\/05\/2026|2026-05-05/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('shows empty state message when no closed CAPAs', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[]}
        onSelectCapa={mockOnSelect}
      />
    );

    expect(screen.getByText(/No closed CAPA records found/i)).toBeInTheDocument();
  });

  it('shows root cause from first root_causes entry', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa]}
        onSelectCapa={mockOnSelect}
      />
    );

    expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
  });

  it('displays "Not specified" when root_causes is empty', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('calculates days to close correctly', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa]}
        onSelectCapa={mockOnSelect}
      />
    );

    // From 2026-04-01 to 2026-05-05 is 34 days
    expect(screen.getByText('34 days')).toBeInTheDocument();
  });

  it('calls onSelectCapa when row is clicked', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa]}
        onSelectCapa={mockOnSelect}
      />
    );

    const findingIdElement = screen.getByText('finding-456');
    fireEvent.click(findingIdElement);

    expect(mockOnSelect).toHaveBeenCalledWith(closedCapa);
  });

  it('filters by search term (finding ID)', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'finding-456' } });

    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();
  });

  it('filters by search term (problem statement)', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Fixed issue' } });

    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();
  });

  it('filters by month (date picker)', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement;
    fireEvent.change(monthInput, { target: { value: '2026-05' } });

    expect(screen.getByText('finding-456')).toBeInTheDocument();
    // capa2 has updated_at: '2026-06-02', so it won't match 2026-05
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();
  });

  it('applies AND logic for search and date filters', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    const monthInput = container.querySelector('input[type="month"]') as HTMLInputElement;

    // Set search to finding-456 and month to 2026-05
    fireEvent.change(searchInput, { target: { value: 'finding-456' } });
    fireEvent.change(monthInput, { target: { value: '2026-05' } });

    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();
  });

  it('shows empty state when filters match no records', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText(/No closed CAPA records found/i)).toBeInTheDocument();
  });

  it('displays table headers correctly', () => {
    const mockOnSelect = vi.fn();
    render(
      <CapaHistoryList
        closedCapas={[closedCapa]}
        onSelectCapa={mockOnSelect}
      />
    );

    expect(screen.getByText('Finding ID')).toBeInTheDocument();
    expect(screen.getByText('Root Cause')).toBeInTheDocument();
    expect(screen.getByText('Closed Date')).toBeInTheDocument();
    expect(screen.getByText('Days to Close')).toBeInTheDocument();
  });

  it('clears search filter and displays all records', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <CapaHistoryList
        closedCapas={[closedCapa, closedCapa2]}
        onSelectCapa={mockOnSelect}
      />
    );

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    // Set search term
    fireEvent.change(searchInput, { target: { value: 'finding-456' } });
    expect(screen.queryByText('finding-789')).not.toBeInTheDocument();

    // Clear search term
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('finding-456')).toBeInTheDocument();
    expect(screen.getByText('finding-789')).toBeInTheDocument();
  });
});
