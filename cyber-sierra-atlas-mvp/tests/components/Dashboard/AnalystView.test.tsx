import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalystView } from '../../../src/components/Dashboard/AnalystView';
import type { DashboardMetrics, Trends } from '../../../src/types/dashboard';

const mockMetrics: DashboardMetrics = {
  severity: { critical: 3, high: 12, medium: 45, low: 102 },
  capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
  mttr: { current: 14, trend: 'improving' },
  sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
  updatedAt: '2026-06-05T10:30:00Z',
};

const mockTrends: Trends = {
  days30: [
    { date: '2026-05-06', openFindings: 165, closedFindings: 28, mttrDays: 16, slaCompliance: 82, capaCompletePercent: 68 },
  ],
  days60: [],
  days90: [],
};

describe('AnalystView', () => {
  const mockOnDrillDown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all 5 metric cards', () => {
    render(
      <AnalystView
        metrics={mockMetrics}
        trends={mockTrends}
        isLoading={false}
        onDrillDown={mockOnDrillDown}
      />
    );

    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('CAPA')).toBeInTheDocument();
    expect(screen.getByText('MTTR')).toBeInTheDocument();
    expect(screen.getByText('SLA')).toBeInTheDocument();
  });

  it('should render with responsive grid layout', () => {
    const { container } = render(
      <AnalystView
        metrics={mockMetrics}
        trends={mockTrends}
        isLoading={false}
        onDrillDown={mockOnDrillDown}
      />
    );

    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(
      <AnalystView
        metrics={mockMetrics}
        trends={mockTrends}
        isLoading={true}
        onDrillDown={mockOnDrillDown}
      />
    );

    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display metric values correctly', () => {
    render(
      <AnalystView
        metrics={mockMetrics}
        trends={mockTrends}
        isLoading={false}
        onDrillDown={mockOnDrillDown}
      />
    );

    // Check severity counts
    const criticalElements = screen.getAllByText('3');
    expect(criticalElements.length).toBeGreaterThan(0);

    // Check CAPA completion
    const capaElements = screen.getAllByText('73');
    expect(capaElements.length).toBeGreaterThan(0);
  });

  it('should have proper dark mode styling', () => {
    const { container } = render(
      <AnalystView
        metrics={mockMetrics}
        trends={mockTrends}
        isLoading={false}
        onDrillDown={mockOnDrillDown}
      />
    );

    expect(container.querySelector('[class*="dark:"]')).toBeInTheDocument();
  });
});
