import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from '../../../src/components/Dashboard/MetricCard';

describe('MetricCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render metric card with title and value', () => {
    render(
      <MetricCard
        title="Critical Findings"
        value={3}
        unit="items"
        trend="improving"
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('Critical Findings')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('should render trend indicator', () => {
    render(
      <MetricCard
        title="MTTR"
        value={14}
        unit="days"
        trend="improving"
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText(/improving/i)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(
      <MetricCard
        title="Test Metric"
        value={10}
        unit="count"
        trend="stable"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByText('Test Metric').closest('button');
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(
      <MetricCard
        title="Loading Metric"
        value={0}
        unit="count"
        trend="stable"
        onClick={mockOnClick}
        isLoading={true}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have proper dark mode classes', () => {
    const { container } = render(
      <MetricCard
        title="Dark Mode Test"
        value={5}
        unit="items"
        trend="improving"
        onClick={mockOnClick}
      />
    );

    const card = container.querySelector('[class*="dark:"]');
    expect(card).toBeInTheDocument();
  });

  it('should have accessibility labels', () => {
    render(
      <MetricCard
        title="Accessible Metric"
        value={7}
        unit="findings"
        trend="stable"
        onClick={mockOnClick}
      />
    );

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBeTruthy();
  });

  it('should render without onClick handler', () => {
    render(
      <MetricCard
        title="No Click Metric"
        value={2}
        unit="items"
        trend="stable"
      />
    );
    expect(screen.getByText('No Click Metric')).toBeInTheDocument();
  });

  it('should display trend indicator with correct styling', () => {
    const { rerender } = render(
      <MetricCard
        title="Trend Test"
        value={10}
        unit="count"
        trend="improving"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(/improving/i)).toBeInTheDocument();

    rerender(
      <MetricCard
        title="Trend Test"
        value={10}
        unit="count"
        trend="degrading"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(/degrading/i)).toBeInTheDocument();
  });
});
