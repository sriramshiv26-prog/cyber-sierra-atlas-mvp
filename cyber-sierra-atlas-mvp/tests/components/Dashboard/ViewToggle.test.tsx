import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '../../../src/components/Dashboard/ViewToggle';

describe('ViewToggle', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both view options', () => {
    render(<ViewToggle current="analyst" onChange={mockOnChange} />);
    expect(screen.getByText('Analyst View')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
  });

  it('should highlight current view', () => {
    render(<ViewToggle current="analyst" onChange={mockOnChange} />);
    const analystButton = screen.getByRole('button', { name: /Analyst View/i });
    expect(analystButton).toHaveClass('bg-blue-600');
  });

  it('should call onChange when switching views', () => {
    render(<ViewToggle current="analyst" onChange={mockOnChange} />);
    const executiveButton = screen.getByRole('button', { name: /Executive Summary/i });
    fireEvent.click(executiveButton);
    expect(mockOnChange).toHaveBeenCalledWith('executive');
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<ViewToggle current="analyst" onChange={mockOnChange} />);

    const analystButton = screen.getByRole('button', { name: /Analyst View/i });
    analystButton.focus();
    expect(analystButton).toHaveFocus();

    await user.keyboard('{Tab}');
    const executiveButton = screen.getByRole('button', { name: /Executive Summary/i });
    expect(executiveButton).toHaveFocus();
  });

  it('should update highlight when current view changes', () => {
    const { rerender } = render(<ViewToggle current="analyst" onChange={mockOnChange} />);
    let analystButton = screen.getByRole('button', { name: /Analyst View/i });
    expect(analystButton).toHaveClass('bg-blue-600');

    rerender(<ViewToggle current="executive" onChange={mockOnChange} />);
    const executiveButton = screen.getByRole('button', { name: /Executive Summary/i });
    expect(executiveButton).toHaveClass('bg-blue-600');

    analystButton = screen.getByRole('button', { name: /Analyst View/i });
    expect(analystButton).not.toHaveClass('bg-blue-600');
  });

  it('should have proper ARIA attributes', () => {
    render(<ViewToggle current="analyst" onChange={mockOnChange} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-pressed');
    });
  });
});
