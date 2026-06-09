import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../../../src/components/Dashboard/FilterBar';

describe('FilterBar', () => {
  it('should render all severity checkboxes', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    expect(screen.getByLabelText(/critical/i)).toBeTruthy();
    expect(screen.getByLabelText(/high/i)).toBeTruthy();
    expect(screen.getByLabelText(/medium/i)).toBeTruthy();
    expect(screen.getByLabelText(/low/i)).toBeTruthy();
  });

  it('should render all status checkboxes', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    expect(screen.getByLabelText(/open/i)).toBeTruthy();
    expect(screen.getByLabelText(/in progress/i)).toBeTruthy();
    expect(screen.getByLabelText(/resolved/i)).toBeTruthy();
    expect(screen.getByLabelText(/at risk/i)).toBeTruthy();
    expect(screen.getByLabelText(/overdue/i)).toBeTruthy();
  });

  it('should render date range inputs', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    expect(screen.getByLabelText(/from/i)).toBeTruthy();
    expect(screen.getByLabelText(/to/i)).toBeTruthy();
  });

  it('should call onFilter with selected severity', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
    fireEvent.click(criticalCheckbox);

    const applyButton = screen.getByText(/apply filter/i);
    fireEvent.click(applyButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: ['critical'],
      })
    );
  });

  it('should call onFilter with multiple severities', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
    const highCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;
    fireEvent.click(criticalCheckbox);
    fireEvent.click(highCheckbox);

    const applyButton = screen.getByText(/apply filter/i);
    fireEvent.click(applyButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: expect.arrayContaining(['critical', 'high']),
      })
    );
  });

  it('should call onFilter with status criteria', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const openCheckbox = screen.getByLabelText(/filter by open/i) as HTMLInputElement;
    fireEvent.click(openCheckbox);

    const applyButton = screen.getByText(/apply filter/i);
    fireEvent.click(applyButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['open'],
      })
    );
  });

  it('should call onFilter with date range', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const startInput = screen.getByLabelText(/from/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/to/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2026-06-01' } });
    fireEvent.change(endInput, { target: { value: '2026-06-05' } });

    const applyButton = screen.getByText(/apply filter/i);
    fireEvent.click(applyButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: {
          start: '2026-06-01',
          end: '2026-06-05',
        },
      })
    );
  });

  it('should clear all filters on Clear button click', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
    fireEvent.click(criticalCheckbox);

    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);

    expect(onFilter).toHaveBeenCalledWith({});
    expect(criticalCheckbox.checked).toBe(false);
  });

  it('should toggle checkboxes on and off', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
    fireEvent.click(criticalCheckbox);
    expect(criticalCheckbox.checked).toBe(true);

    fireEvent.click(criticalCheckbox);
    expect(criticalCheckbox.checked).toBe(false);
  });

  it('should apply filter with all criteria combined', () => {
    const onFilter = vi.fn();
    render(<FilterBar onFilter={onFilter} />);

    const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
    const openCheckbox = screen.getByLabelText(/filter by open/i) as HTMLInputElement;
    const startInput = screen.getByLabelText(/from/i) as HTMLInputElement;

    fireEvent.click(criticalCheckbox);
    fireEvent.click(openCheckbox);
    fireEvent.change(startInput, { target: { value: '2026-06-01' } });

    const applyButton = screen.getByText(/apply filter/i);
    fireEvent.click(applyButton);

    expect(onFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: ['critical'],
        status: ['open'],
        dateRange: expect.any(Object),
      })
    );
  });
});
