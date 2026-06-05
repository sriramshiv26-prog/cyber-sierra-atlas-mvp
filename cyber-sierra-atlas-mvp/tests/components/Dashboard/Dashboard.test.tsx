import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../../../src/components/Dashboard';
import * as dashboardApi from '../../../src/api/dashboard';

vi.mock('../../../src/api/dashboard');

const mockMetrics = {
  severity: { critical: 3, high: 12, medium: 45, low: 102 },
  capa: { percentComplete: 73, inProgress: 15, atRisk: 8, overdue: 2 },
  mttr: { current: 14, trend: 'improving' as const },
  sla: { percentCompliant: 85, overdueFindings: 2, overdueCAPAs: 1 },
  updatedAt: '2026-06-05T10:30:00Z',
};

const mockTrends = {
  days30: [
    { date: '2026-05-06', openFindings: 165, closedFindings: 28, mttrDays: 16, slaCompliance: 82, capaCompletePercent: 68 },
  ],
  days60: [],
  days90: [],
};

// Simple stub for Recharts that just renders nothing
vi.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: () => null,
  BarChart: () => null,
  Bar: () => null,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (dashboardApi.getDashboardMetrics as any).mockResolvedValue(mockMetrics);
    (dashboardApi.getDashboardTrends as any).mockResolvedValue(mockTrends);
  });

  it('should render dashboard component', () => {
    render(<Dashboard />);
    // Just verify component doesn't crash
    expect(screen.queryByText(/Monitoring Dashboard/i)).toBeTruthy();
  });

  it('should call API functions on mount', () => {
    render(<Dashboard />);
    expect(dashboardApi.getDashboardMetrics).toHaveBeenCalled();
  });

  it('should display header', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Monitoring Dashboard/i)).toBeInTheDocument();
  });
});
