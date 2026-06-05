import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../src/components/Dashboard/Header';

describe('Header', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', () => {
    render(<Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={false} />);
    expect(screen.getByText(/Monitoring Dashboard/i)).toBeInTheDocument();
  });

  it('should display last refresh time', () => {
    const now = new Date();
    render(<Header lastRefresh={now} onManualRefresh={mockOnRefresh} isLoading={false} />);
    expect(screen.getByText(/Updated/i)).toBeInTheDocument();
  });

  it('should render manual refresh button', () => {
    render(<Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={false} />);
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
  });

  it('should call onManualRefresh when refresh button is clicked', () => {
    render(<Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={false} />);
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should show loading spinner when isLoading is true', () => {
    render(<Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should disable refresh button during loading', () => {
    render(<Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={true} />);
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('should have dark mode styling', () => {
    const { container } = render(
      <Header lastRefresh={new Date()} onManualRefresh={mockOnRefresh} isLoading={false} />
    );
    expect(container.querySelector('[class*="dark:"]')).toBeInTheDocument();
  });
});
