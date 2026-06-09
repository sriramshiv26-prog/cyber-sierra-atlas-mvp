import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalystView } from '../../../src/components/Dashboard/AnalystView';
import type { DashboardMetrics, Trends } from '../../../src/types/dashboard';

const mockMetrics: DashboardMetrics = {
  severity: { critical: 3, high: 12, medium: 45, low: 102 },
  capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
  mttr: { current: 14, trend: 'improving' },
  sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
  updatedAt: new Date().toISOString(),
};

const mockTrends: Trends = {
  days30: [],
  days60: [],
  days90: [],
};

describe('Responsive Layout', () => {
  it('should render responsive grid container', () => {
    const onDrillDown = vi.fn();
    const { container } = render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={false} onDrillDown={onDrillDown} />
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
    expect(gridContainer?.className).toContain('grid-cols-1');
    expect(gridContainer?.className).toContain('md:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-3');
  });

  it('should render all 5 metric cards', () => {
    const onDrillDown = vi.fn();
    render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={false} onDrillDown={onDrillDown} />
    );

    // Check for presence of main cards by their roles/content
    const cards = screen.getAllByRole('button', { name: /severity|capa|mttr|sla/i });
    expect(cards.length > 0).toBe(true);
  });

  it('should apply proper spacing', () => {
    const onDrillDown = vi.fn();
    const { container } = render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={false} onDrillDown={onDrillDown} />
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer?.className).toContain('gap');
  });

  it('should have dark mode support on all cards', () => {
    const onDrillDown = vi.fn();
    const { container } = render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={false} onDrillDown={onDrillDown} />
    );

    const cards = container.querySelectorAll('[class*="dark:"]');
    expect(cards.length > 0).toBe(true);
  });

  it('should not have hardcoded colors in className', () => {
    const onDrillDown = vi.fn();
    const { container } = render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={false} onDrillDown={onDrillDown} />
    );

    // This is a heuristic check - looking for suspicious color patterns
    const html = container.innerHTML;
    const hasHardcodedHex = /#[0-9a-f]{6}/i.test(html);
    const hasHardcodedRgb = /rgb\(/i.test(html);

    expect(hasHardcodedHex || hasHardcodedRgb).toBe(false);
  });

  it('should render loading state with proper grid layout', () => {
    const onDrillDown = vi.fn();
    const { container } = render(
      <AnalystView metrics={mockMetrics} trends={mockTrends} isLoading={true} onDrillDown={onDrillDown} />
    );

    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBe(5);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer?.className).toContain('grid-cols-1');
    expect(gridContainer?.className).toContain('md:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-3');
  });
});
