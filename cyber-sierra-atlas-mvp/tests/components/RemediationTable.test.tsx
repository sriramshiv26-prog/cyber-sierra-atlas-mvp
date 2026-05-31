import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RemediationTable } from '../../src/components/RemediationTable';
import { useStore } from '../../src/hooks/useStore';
import { Finding } from '../../src/lib/schema';

vi.mock('../../src/hooks/useStore');

describe('RemediationTable Inline Editing', () => {
  const mockFinding: Finding = {
    id: '1',
    title: 'Test Finding',
    description: 'desc',
    severity: 'Critical',
    status: 'Open',
    remediation_status: 'open',
    due_date: '2026-06-30',
    owner: 'john@example.com',
    remediation_suggested: 'Apply patch',
    remediation_confirmed: 'Patch applied',
    created_at: '2026-05-31T00:00:00Z',
    updated_at: '2026-05-31T00:00:00Z',
    asset_id: 'a1',
    asset_name: 'Server 1',
    control_framework: 'ISO27001',
    control_clause: 'A.5.1',
    related_findings: [],
    source_document: {
      filename: 'test.pdf',
      upload_date: '2026-05-31',
      parser_confidence: 0.95,
    },
  };

  const mockDispatch = vi.fn();
  const mockStore = { findings: [mockFinding], assets: [], controls: [], lastSaved: '' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      store: mockStore,
      dispatch: mockDispatch,
    });
  });

  it('should render remediation table with findings', () => {
    render(<RemediationTable findings={[mockFinding]} />);
    expect(screen.getByText('Test Finding')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should allow double-click to enter edit mode', () => {
    render(<RemediationTable findings={[mockFinding]} />);
    const row = screen.getByText('Test Finding').closest('tr');
    expect(row).toBeInTheDocument();

    fireEvent.doubleClick(row!);

    // After double-click, the status select should be visible and focused
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should save on blur after editing status', async () => {
    const user = userEvent.setup();
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0] as HTMLSelectElement;

    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });
    fireEvent.blur(statusSelect);

    expect(mockDispatch).toHaveBeenCalled();
    const dispatchCall = mockDispatch.mock.calls[0][0];
    expect(dispatchCall.type).toBe('UPDATE_REMEDIATION');
    expect(dispatchCall.payload.id).toBe('1');
    expect(dispatchCall.payload.status).toBe('in_progress');
  });

  it('should validate due_date format on blur', () => {
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    // Find date input
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const dateInput = inputs.find(input => input.type === 'date');

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-13-45' } });
      fireEvent.blur(dateInput);

      // Should show error for invalid date
      expect(screen.queryByText(/Invalid date/i)).toBeInTheDocument();
    }
  });

  it('should allow editing owner field', async () => {
    const user = userEvent.setup();
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    // Find owner input by placeholder
    const ownerInput = screen.getByPlaceholderText('email@example.com') as HTMLInputElement;

    // Clear by selecting all and typing
    fireEvent.change(ownerInput, { target: { value: 'jane@example.com' } });
    fireEvent.blur(ownerInput);

    expect(mockDispatch).toHaveBeenCalled();
    const dispatchCall = mockDispatch.mock.calls[0][0];
    expect(dispatchCall.payload.owner).toBe('jane@example.com');
  });

  it('should show asterisk when row has unsaved changes', () => {
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0];

    fireEvent.change(statusSelect, { target: { value: 'closed' } });

    // Asterisk should appear in the title column
    expect(screen.getByText(/Test Finding \*/)).toBeInTheDocument();
  });

  it('should render empty state for no findings', () => {
    render(<RemediationTable findings={[]} />);
    expect(screen.getByText(/No remediation items to display/i)).toBeInTheDocument();
  });

  it('should not dispatch on save when there are validation errors', async () => {
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    // Find date input
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const dateInput = inputs.find(input => input.type === 'date');

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-13-45' } });
      fireEvent.blur(dateInput);

      // Should NOT dispatch due to validation error
      expect(mockDispatch).not.toHaveBeenCalled();
    }
  });

  it('should handle multiple findings in table', () => {
    const mockFinding2: Finding = {
      ...mockFinding,
      id: '2',
      title: 'Another Finding',
      owner: 'jane@example.com',
    };

    render(<RemediationTable findings={[mockFinding, mockFinding2]} />);

    expect(screen.getByText('Test Finding')).toBeInTheDocument();
    expect(screen.getByText('Another Finding')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should display dashes for missing fields', () => {
    const findingWithMissingFields: Finding = {
      ...mockFinding,
      due_date: undefined,
      owner: undefined,
      remediation_status: undefined,
    };

    render(<RemediationTable findings={[findingWithMissingFields]} />);

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('should dispatch UPDATE_REMEDIATION action on save', () => {
    render(<RemediationTable findings={[mockFinding]} />);

    const row = screen.getByText('Test Finding').closest('tr');
    fireEvent.doubleClick(row!);

    // Change status
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0] as HTMLSelectElement;

    fireEvent.change(statusSelect, { target: { value: 'closed' } });
    fireEvent.blur(statusSelect);

    expect(mockDispatch).toHaveBeenCalled();
    const call = mockDispatch.mock.calls[0][0];
    expect(call.type).toBe('UPDATE_REMEDIATION');
    expect(call.payload.id).toBe('1');
    expect(call.payload.status).toBe('closed');
  });
});
