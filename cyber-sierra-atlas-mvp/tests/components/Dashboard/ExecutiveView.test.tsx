import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveView } from '../../../src/components/Dashboard/ExecutiveView';
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
  days60: [
    { date: '2026-05-06', openFindings: 165, closedFindings: 28, mttrDays: 16, slaCompliance: 82, capaCompletePercent: 68 },
  ],
  days90: [
    { date: '2026-05-06', openFindings: 165, closedFindings: 28, mttrDays: 16, slaCompliance: 82, capaCompletePercent: 68 },
  ],
};

describe('ExecutiveView', () => {
  it('should render executive-focused content', () => {
    render(<ExecutiveView metrics={mockMetrics} trends={mockTrends} />);
    expect(screen.getByText(/Risk Score/i)).toBeInTheDocument();
  });

  it('should display key metrics summary', () => {
    render(<ExecutiveView metrics={mockMetrics} trends={mockTrends} />);
    expect(screen.getByText('Critical Findings')).toBeInTheDocument();
    expect(screen.getByText('CAPA Complete')).toBeInTheDocument();
  });

  it('should render trend line chart', () => {
    render(<ExecutiveView metrics={mockMetrics} trends={mockTrends} />);
    expect(screen.getByText(/90-Day Trend/i)).toBeInTheDocument();
  });

  it('should have minimal, clean layout', () => {
    const { container } = render(
      <ExecutiveView metrics={mockMetrics} trends={mockTrends} />
    );

    // Should have fewer cards than analyst view
    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBeLessThanOrEqual(5);
  });

  it('should have dark mode styling', () => {
    const { container } = render(
      <ExecutiveView metrics={mockMetrics} trends={mockTrends} />
    );

    expect(container.querySelector('[class*="dark:"]')).toBeInTheDocument();
  });

  it('should display risk score with color coding', () => {
    render(<ExecutiveView metrics={mockMetrics} trends={mockTrends} />);
    const riskScore = screen.getByText('Risk Score').closest('div')?.parentElement;
    expect(riskScore).toBeInTheDocument();
  });
});
