import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeverityCard } from '../../../src/components/Dashboard/SeverityCard';
import { CapaCard } from '../../../src/components/Dashboard/CapaCard';
import { MttrCard } from '../../../src/components/Dashboard/MttrCard';
import { SlaCard } from '../../../src/components/Dashboard/SlaCard';

describe('SeverityCard', () => {
  const mockMetrics = {
    critical: 3,
    high: 12,
    medium: 45,
    low: 102,
  };
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all severity levels', () => {
    render(<SeverityCard severity={mockMetrics} onClick={mockOnClick} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should display correct counts', () => {
    render(<SeverityCard severity={mockMetrics} onClick={mockOnClick} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
  });

  it('should call onClick when clicking a severity level', () => {
    render(<SeverityCard severity={mockMetrics} onClick={mockOnClick} />);
    const criticalButton = screen.getByText('Critical').closest('button');
    fireEvent.click(criticalButton!);
    expect(mockOnClick).toHaveBeenCalledWith('critical');
  });
});

describe('CapaCard', () => {
  const mockCapa = {
    percentComplete: 73,
    inProgress: 15,
    atRisk: 8,
    overdue: 2,
  };
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CAPA completion percentage', () => {
    render(<CapaCard capa={mockCapa} onClick={mockOnClick} />);
    expect(screen.getByText('CAPA')).toBeInTheDocument();
    expect(screen.getByText(/73/)).toBeInTheDocument();
  });

  it('should display breakdown counts', () => {
    render(<CapaCard capa={mockCapa} onClick={mockOnClick} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/8/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(<CapaCard capa={mockCapa} onClick={mockOnClick} />);
    const card = screen.getByText('CAPA').closest('button');
    fireEvent.click(card!);
    expect(mockOnClick).toHaveBeenCalled();
  });
});

describe('MttrCard', () => {
  const mockMttr = {
    current: 14,
    trend: 'improving' as const,
  };
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render MTTR value and unit', () => {
    render(<MttrCard mttr={mockMttr} onClick={mockOnClick} />);
    expect(screen.getByText('MTTR')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('days')).toBeInTheDocument();
  });

  it('should display trend indicator', () => {
    render(<MttrCard mttr={mockMttr} onClick={mockOnClick} />);
    expect(screen.getByText(/improving/i)).toBeInTheDocument();
  });
});

describe('SlaCard', () => {
  const mockSla = {
    percentCompliant: 85,
    overdueFindings: 2,
    overdueCAPAs: 1,
  };
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SLA compliance percentage', () => {
    render(<SlaCard sla={mockSla} onClick={mockOnClick} />);
    expect(screen.getByText('SLA')).toBeInTheDocument();
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('should display overdue counts', () => {
    render(<SlaCard sla={mockSla} onClick={mockOnClick} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
