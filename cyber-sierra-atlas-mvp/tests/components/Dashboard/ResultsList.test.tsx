import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsList } from '../../../src/components/Dashboard/ResultsList';

const mockResults = [
  {
    id: '1',
    title: 'Critical finding',
    severity: 'critical',
    status: 'open',
    createdAt: '2026-06-05T10:00:00Z',
    type: 'finding' as const,
  },
  {
    id: '2',
    title: 'High finding',
    severity: 'high',
    status: 'in_progress',
    createdAt: '2026-06-04T10:00:00Z',
    type: 'finding' as const,
  },
];

describe('ResultsList', () => {
  it('should render results table', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('Critical finding')).toBeTruthy();
    expect(screen.getByText('High finding')).toBeTruthy();
  });

  it('should display severity badges', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
      />
    );

    const criticalBadges = screen.getAllByText(/critical/i);
    const highBadges = screen.getAllByText(/high/i);

    expect(criticalBadges.length).toBeGreaterThan(0);
    expect(highBadges.length).toBeGreaterThan(0);
  });

  it('should display status labels', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/OPEN/i)).toBeTruthy();
    expect(screen.getByText(/IN PROGRESS/i)).toBeTruthy();
  });

  it('should call onPageChange when next button clicked', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByLabelText(/next page/i);
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when prev button clicked', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={2}
        pageSize={10}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByLabelText(/previous page/i);
    fireEvent.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable next button on last page', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByLabelText(/next page/i) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });

  it('should disable prev button on first page', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByLabelText(/previous page/i) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('should call onRowClick when row clicked', () => {
    const onPageChange = vi.fn();
    const onRowClick = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('Critical finding').closest('tr');
    fireEvent.click(row!);

    expect(onRowClick).toHaveBeenCalledWith(mockResults[0]);
  });

  it('should show no results message when empty', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={[]}
        currentPage={1}
        pageSize={10}
        totalPages={0}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/no results found/i)).toBeTruthy();
  });

  it('should show loading skeleton when isLoading is true', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={[]}
        currentPage={1}
        pageSize={10}
        totalPages={0}
        onPageChange={onPageChange}
        isLoading={true}
      />
    );

    const skeletons = screen.queryAllByRole('status');
    expect(skeletons.length > 0).toBe(true);
  });

  it('should display pagination info', () => {
    const onPageChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={2}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/page 1 of 2/i)).toBeTruthy();
  });

  it('should handle keyboard navigation for result rows', () => {
    const onPageChange = vi.fn();
    const onRowClick = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        currentPage={1}
        pageSize={10}
        totalPages={1}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('Critical finding').closest('tr');
    fireEvent.keyDown(row!, { key: 'Enter' });

    expect(onRowClick).toHaveBeenCalledWith(mockResults[0]);
  });
});
