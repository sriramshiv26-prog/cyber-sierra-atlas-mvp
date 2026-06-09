import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../../../src/components/Dashboard/FilterBar';
import { ResultsList } from '../../../src/components/Dashboard/ResultsList';
import { DrillDownPanel } from '../../../src/components/Dashboard/DrillDownPanel';

describe('Edge Cases', () => {
  describe('FilterBar Edge Cases', () => {
    it('should handle multiple selections and clear', () => {
      const onFilter = vi.fn();
      render(<FilterBar onFilter={onFilter} />);

      // Select multiple items
      const criticalCheckbox = screen.getByLabelText(/critical/i) as HTMLInputElement;
      const highCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;

      fireEvent.click(criticalCheckbox);
      fireEvent.click(highCheckbox);

      expect(criticalCheckbox.checked).toBe(true);
      expect(highCheckbox.checked).toBe(true);

      // Clear all
      const clearButton = screen.getByText(/clear/i);
      fireEvent.click(clearButton);

      expect(criticalCheckbox.checked).toBe(false);
      expect(highCheckbox.checked).toBe(false);
      expect(onFilter).toHaveBeenCalledWith({});
    });

    it('should handle date range with only start date', () => {
      const onFilter = vi.fn();
      render(<FilterBar onFilter={onFilter} />);

      const startInput = screen.getByLabelText(/from/i) as HTMLInputElement;
      fireEvent.change(startInput, { target: { value: '2026-06-01' } });

      const applyButton = screen.getByText(/apply filter/i);
      fireEvent.click(applyButton);

      expect(onFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.any(Object),
        })
      );
    });

    it('should handle date range with only end date', () => {
      const onFilter = vi.fn();
      render(<FilterBar onFilter={onFilter} />);

      const endInput = screen.getByLabelText(/to/i) as HTMLInputElement;
      fireEvent.change(endInput, { target: { value: '2026-06-05' } });

      const applyButton = screen.getByText(/apply filter/i);
      fireEvent.click(applyButton);

      expect(onFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.any(Object),
        })
      );
    });

    it('should handle toggling same checkbox multiple times', () => {
      const onFilter = vi.fn();
      render(<FilterBar onFilter={onFilter} />);

      const checkbox = screen.getByLabelText(/critical/i) as HTMLInputElement;

      fireEvent.click(checkbox); // Select
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox); // Deselect
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox); // Select again
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('ResultsList Edge Cases', () => {
    it('should handle single result', () => {
      const onPageChange = vi.fn();
      const singleResult = [
        {
          id: '1',
          title: 'Single finding',
          severity: 'critical',
          status: 'open',
          createdAt: '2026-06-05T10:00:00Z',
          type: 'finding' as const,
        },
      ];

      render(
        <ResultsList
          results={singleResult}
          currentPage={1}
          pageSize={10}
          totalPages={1}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText('Single finding')).toBeTruthy();
      const nextButton = screen.getByLabelText(/next page/i) as HTMLButtonElement;
      expect(nextButton.disabled).toBe(true);
    });

    it('should handle very long titles', () => {
      const onPageChange = vi.fn();
      const longTitle = 'A'.repeat(200);
      const results = [
        {
          id: '1',
          title: longTitle,
          severity: 'critical',
          status: 'open',
          createdAt: '2026-06-05T10:00:00Z',
          type: 'finding' as const,
        },
      ];

      const { container } = render(
        <ResultsList
          results={results}
          currentPage={1}
          pageSize={10}
          totalPages={1}
          onPageChange={onPageChange}
        />
      );

      // Check that title is rendered (truncate class present)
      const titleCell = container.querySelector('td');
      expect(titleCell?.textContent?.includes('A')).toBe(true);
    });

    it('should handle pagination at boundaries', () => {
      const onPageChange = vi.fn();
      const results = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        title: `Finding ${i}`,
        severity: 'critical',
        status: 'open',
        createdAt: '2026-06-05T10:00:00Z',
        type: 'finding' as const,
      }));

      const { rerender } = render(
        <ResultsList
          results={results}
          currentPage={1}
          pageSize={10}
          totalPages={2}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByLabelText(/next page/i);
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);

      // Simulate page 2
      rerender(
        <ResultsList
          results={results}
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
  });

  describe('DrillDownPanel Edge Cases', () => {
    it('should close on escape key press', () => {
      const onClose = vi.fn();
      const onFilter = vi.fn();

      render(
        <DrillDownPanel
          isOpen={true}
          results={[]}
          filter={{}}
          onClose={onClose}
          onFilter={onFilter}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle opening with empty results', () => {
      const onClose = vi.fn();
      const onFilter = vi.fn();

      render(
        <DrillDownPanel
          isOpen={true}
          results={[]}
          filter={{}}
          onClose={onClose}
          onFilter={onFilter}
        />
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/results \(0\)/i)).toBeTruthy();
    });

    it('should handle filter changes while loading', () => {
      const onClose = vi.fn();
      const onFilter = vi.fn();

      const { rerender } = render(
        <DrillDownPanel
          isOpen={true}
          results={[]}
          filter={{}}
          isLoading={true}
          onClose={onClose}
          onFilter={onFilter}
        />
      );

      fireEvent.click(screen.getByLabelText(/filter by critical/i));
      fireEvent.click(screen.getAllByText(/apply filter/i)[0]);

      // Simulate results arriving
      const results = [
        {
          id: '1',
          title: 'Critical finding',
          severity: 'critical',
          status: 'open',
          createdAt: '2026-06-05T10:00:00Z',
          type: 'finding' as const,
        },
      ];

      rerender(
        <DrillDownPanel
          isOpen={true}
          results={results}
          filter={{ severity: ['critical'] }}
          isLoading={false}
          onClose={onClose}
          onFilter={onFilter}
        />
      );

      expect(screen.getByText('Critical finding')).toBeTruthy();
    });
  });
});
