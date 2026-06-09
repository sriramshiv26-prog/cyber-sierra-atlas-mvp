import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrillDownPanel } from '../../../src/components/Dashboard/DrillDownPanel';

const mockResults = [
  {
    id: '1',
    title: 'Critical finding',
    severity: 'critical',
    status: 'open',
    createdAt: '2026-06-05T10:00:00Z',
    type: 'finding' as const,
  },
];

describe('DrillDownPanel', () => {
  it('should not render when isOpen is false', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    const { container } = render(
      <DrillDownPanel
        isOpen={false}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('should render when isOpen is true', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/drill-down results/i)).toBeTruthy();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const closeButton = screen.getByLabelText(/close drill-down/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when Close button in footer clicked', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    const footerButton = closeButtons[closeButtons.length - 1]; // Last close button is the footer one
    fireEvent.click(footerButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay clicked', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    const { container } = render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const overlay = container.querySelector('div[aria-hidden="true"]');
    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close on Escape key press', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should render FilterBar', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const filterSection = screen.getByText(/filters/i);
    expect(filterSection).toBeTruthy();
  });

  it('should render results list', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    expect(screen.getByText('Critical finding')).toBeTruthy();
  });

  it('should display result count', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    expect(screen.getByText(/results \(1\)/i)).toBeTruthy();
  });

  it('should call onFilter when filter is applied', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const criticalCheckbox = screen.getByLabelText(/filter by critical/i) as HTMLInputElement;
    fireEvent.click(criticalCheckbox);

    const applyButtons = screen.getAllByText(/apply filter/i);
    fireEvent.click(applyButtons[0]);

    expect(onFilter).toHaveBeenCalled();
  });

  it('should call onRowClick when result clicked', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    const onRowClick = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('Critical finding').closest('tr');
    fireEvent.click(row!);

    expect(onRowClick).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        isLoading={true}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should have aria-modal attribute', () => {
    const onClose = vi.fn();
    const onFilter = vi.fn();
    render(
      <DrillDownPanel
        isOpen={true}
        results={mockResults}
        filter={{}}
        onClose={onClose}
        onFilter={onFilter}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});
