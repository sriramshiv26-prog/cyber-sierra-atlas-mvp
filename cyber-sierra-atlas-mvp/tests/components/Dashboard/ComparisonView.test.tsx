import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonView } from '../../../src/components/Dashboard/ComparisonView';
import type { PeriodComparison } from '../../../src/types/dashboard';

const mockComparison: PeriodComparison = {
  current: {
    period: 'this_week',
    startDate: '2026-06-02',
    endDate: '2026-06-08',
    metrics: {
      severity: { critical: 5, high: 15, medium: 45, low: 102 },
      capa: { percentComplete: 75, inProgress: 15, atRisk: 8, overdue: 2 },
      mttr: { current: 12, trend: 'improving' },
      sla: { percentCompliant: 88, overdueFindings: 2, overdueCAPAs: 1 },
      updatedAt: new Date().toISOString(),
    },
  },
  previous: {
    period: 'last_week',
    startDate: '2026-05-26',
    endDate: '2026-06-01',
    metrics: {
      severity: { critical: 3, high: 12, medium: 40, low: 98 },
      capa: { percentComplete: 70, inProgress: 18, atRisk: 10, overdue: 3 },
      mttr: { current: 14, trend: 'stable' },
      sla: { percentCompliant: 85, overdueFindings: 3, overdueCAPAs: 2 },
      updatedAt: new Date().toISOString(),
    },
  },
  deltas: {
    criticalFindings: 2,
    capaCompleteChange: 5,
    mttrChange: 2,
    slaComplianceChange: 3,
  },
};

describe('ComparisonView', () => {
  it('should render comparison data', () => {
    render(<ComparisonView comparison={mockComparison} />);

    expect(screen.getByText(/period comparison/i)).toBeTruthy();
    expect(screen.getByText(/current/i)).toBeTruthy();
    expect(screen.getByText(/previous/i)).toBeTruthy();
  });

  it('should display current period metrics', () => {
    render(<ComparisonView comparison={mockComparison} />);

    const criticalTexts = screen.getAllByText('5');
    expect(criticalTexts.length > 0).toBe(true);

    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
  });

  it('should display previous period metrics', () => {
    render(<ComparisonView comparison={mockComparison} />);

    const previousCritical = screen.getAllByText('3');
    expect(previousCritical.length > 0).toBe(true);

    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
  });

  it('should display date ranges', () => {
    render(<ComparisonView comparison={mockComparison} />);

    expect(screen.getByText(/2026-06-02 to 2026-06-08/)).toBeTruthy();
    expect(screen.getByText(/2026-05-26 to 2026-06-01/)).toBeTruthy();
  });

  it('should show delta indicators', () => {
    render(<ComparisonView comparison={mockComparison} />);

    expect(screen.getByText(/change/i)).toBeTruthy();
  });

  it('should show loading state', () => {
    const { container } = render(<ComparisonView comparison={null} isLoading={true} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length > 0).toBe(true);
  });

  it('should show no data message when comparison is null', () => {
    render(<ComparisonView comparison={null} />);

    expect(screen.getByText(/no comparison data available/i)).toBeTruthy();
  });

  it('should have dark mode support', () => {
    const { container } = render(<ComparisonView comparison={mockComparison} />);

    const darkModeElements = container.querySelectorAll('[class*="dark:"]');
    expect(darkModeElements.length > 0).toBe(true);
  });

  it('should display period labels correctly', () => {
    render(<ComparisonView comparison={mockComparison} />);

    expect(screen.getByText(/current \(week\)/i)).toBeTruthy();
    expect(screen.getByText(/previous \(week\)/i)).toBeTruthy();
  });

  it('should render all metric comparisons', () => {
    render(<ComparisonView comparison={mockComparison} />);

    expect(screen.getByText(/critical findings/i)).toBeTruthy();
    expect(screen.getByText(/capa complete/i)).toBeTruthy();
    expect(screen.getByText(/mttr/i)).toBeTruthy();
    expect(screen.getByText(/sla compliance/i)).toBeTruthy();
  });

  it('should show grid layout for desktop', () => {
    const { container } = render(<ComparisonView comparison={mockComparison} />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer?.className).toContain('md:grid-cols-3');
  });
});
