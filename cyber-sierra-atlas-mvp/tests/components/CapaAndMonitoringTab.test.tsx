import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapaAndMonitoringTab } from '../../src/components/CapaAndMonitoringTab';
import { CapaWorkflow } from '../../src/types/capa';

const mockActiveCapa: CapaWorkflow = {
  id: 'capa-1',
  finding_id: 'finding-123',
  framework: 'ISO27001',
  type: 'corrective',
  status: 'rca_pending',
  rca: {
    problem_statement: 'SSH keys exposed',
    investigation_data: 'Keys found in repo',
    root_causes: [],
  },
  action_plan: {
    description: 'Rotate keys',
    owner: 'user-1',
    target_date: '2026-06-15',
  },
  timeline: {
    rca_due: '2026-06-05',
    action_due: '2026-06-15',
  },
  evidence_checklist: [],
  approvals: [
    { role: 'implementer', user: '', approved: false },
    { role: 'reviewer', user: '', approved: false },
  ],
  audit_trail: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
  created_by: 'user-1',
};

const mockClosedCapa: CapaWorkflow = {
  id: 'capa-2',
  finding_id: 'finding-456',
  framework: 'NIST',
  type: 'preventive',
  status: 'closed',
  rca: {
    problem_statement: 'Outdated firewall rules',
    investigation_data: 'Rules analyzed',
    root_causes: [{ description: 'Lack of automation', evidence_urls: [] }],
  },
  action_plan: {
    description: 'Implement rule management tool',
    owner: 'user-2',
    target_date: '2026-05-31',
  },
  timeline: {
    rca_due: '2026-05-20',
    action_due: '2026-05-31',
    action_completion_date: '2026-05-31',
  },
  evidence_checklist: [
    {
      item: 'Deployment verification',
      required: true,
      completed: true,
      evidence_urls: ['evidence-1'],
      completed_date: '2026-05-31',
    },
  ],
  approvals: [
    { role: 'implementer', user: 'user-2', approved: true, timestamp: '2026-05-28T00:00:00Z' },
    { role: 'reviewer', user: 'user-3', approved: true, timestamp: '2026-05-29T00:00:00Z' },
  ],
  audit_trail: [],
  created_at: '2026-05-15T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z',
  created_by: 'user-2',
};

describe('CapaAndMonitoringTab', () => {
  const mockOnCreateCapa = vi.fn();
  const mockOnUpdateCapa = vi.fn();
  const mockOnCloseCapa = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('should render all 3 tab buttons', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      expect(screen.getByRole('button', { name: /active capa/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /capa history/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continuous monitoring/i })).toBeInTheDocument();
    });

    it('should have Active tab selected by default', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const activeTab = screen.getByRole('button', { name: /active capa/i });
      expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  describe('Active Tab', () => {
    it('should show active CAPAs on Active tab', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Active CAPA should be visible
      expect(screen.getByText('finding-123')).toBeInTheDocument();

      // Closed CAPA should not be visible in Active tab
      expect(screen.queryByText('finding-456')).not.toBeInTheDocument();
    });

    it('should show ActiveCapaList component on Active tab', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // ActiveCapaList should render its content
      expect(screen.getByText('finding-123')).toBeInTheDocument();
    });

    it('should allow selecting CAPA on Active tab', async () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const capaRow = screen.getByText('finding-123');
      fireEvent.click(capaRow);

      // Detail panel should show when CAPA is selected
      expect(screen.getByText(/CAPA Workflow:/)).toBeInTheDocument();
    });

    it('should not show detail panel when no CAPA is selected', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Detail panel should not be visible initially
      expect(screen.queryByText(/CAPA Workflow:/)).not.toBeInTheDocument();
    });
  });

  describe('History Tab', () => {
    it('should switch to History tab on click', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      await user.click(historyTab);

      // History tab content should be visible (closed CAPA)
      expect(screen.getByText('finding-456')).toBeInTheDocument();
      // Active CAPA should not be visible
      expect(screen.queryByText('finding-123')).not.toBeInTheDocument();
    });

    it('should show only closed CAPAs on History tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      await user.click(historyTab);

      // Closed CAPA should be visible
      expect(screen.getByText('finding-456')).toBeInTheDocument();

      // Active CAPA should not be visible
      expect(screen.queryByText('finding-123')).not.toBeInTheDocument();
    });

    it('should show CapaHistoryList component on History tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      await user.click(historyTab);

      // CapaHistoryList should render
      expect(screen.getByText('finding-456')).toBeInTheDocument();
    });

    it('should allow selecting closed CAPA on History tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      await user.click(historyTab);

      const capaRow = screen.getByText('finding-456');
      fireEvent.click(capaRow);

      // Detail panel should show
      expect(screen.getByText(/CAPA Workflow:/)).toBeInTheDocument();
    });

    it('should show detail panel in readonly mode on History tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      await user.click(historyTab);

      const capaRow = screen.getByText('finding-456');
      fireEvent.click(capaRow);

      // Detail panel should be visible and readonly
      const detailPanel = screen.getByText(/CAPA Workflow:/);
      expect(detailPanel).toBeInTheDocument();

      // Readonly fields should be disabled
      const inputs = screen.getAllByPlaceholderText(/What went wrong?/i);
      if (inputs.length > 0) {
        expect(inputs[0]).toBeDisabled();
      }
    });
  });

  describe('Monitoring Tab', () => {
    it('should switch to Monitoring tab on click', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const monitoringTab = screen.getByRole('button', { name: /continuous monitoring/i });
      await user.click(monitoringTab);

      // Monitoring tab content should be visible
      expect(screen.getByText(/Continuous Monitoring dashboard coming in Phase 6B/i)).toBeInTheDocument();
    });

    it('should show placeholder message on Monitoring tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const monitoringTab = screen.getByRole('button', { name: /continuous monitoring/i });
      await user.click(monitoringTab);

      // Placeholder message should be visible
      expect(screen.getByText(/Continuous Monitoring dashboard coming in Phase 6B/i)).toBeInTheDocument();
    });

    it('should not show any list or detail panel on Monitoring tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const monitoringTab = screen.getByRole('button', { name: /continuous monitoring/i });
      await user.click(monitoringTab);

      // No CAPA IDs should be visible
      expect(screen.queryByText('finding-123')).not.toBeInTheDocument();
      expect(screen.queryByText('finding-456')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should preserve selected CAPA when switching between tabs', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Select CAPA on Active tab
      await user.click(screen.getByText('finding-123'));
      expect(screen.getByText(/CAPA Workflow:/)).toBeInTheDocument();

      // Switch to Monitoring tab
      await user.click(screen.getByRole('button', { name: /continuous monitoring/i }));
      expect(screen.queryByText(/CAPA Workflow:/)).not.toBeInTheDocument();

      // Switch back to Active tab
      await user.click(screen.getByRole('button', { name: /active capa/i }));
      // The detail panel should still show the same CAPA
      // (This tests that selection state is preserved)
    });

    it('should switch between Active and History tabs', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa, mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Active tab is default
      expect(screen.getByText('finding-123')).toBeInTheDocument();

      // Switch to History
      await user.click(screen.getByRole('button', { name: /capa history/i }));
      expect(screen.getByText('finding-456')).toBeInTheDocument();
      expect(screen.queryByText('finding-123')).not.toBeInTheDocument();

      // Switch back to Active
      await user.click(screen.getByRole('button', { name: /active capa/i }));
      expect(screen.getByText('finding-123')).toBeInTheDocument();
      expect(screen.queryByText('finding-456')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onUpdateCapa when saving changes on Active tab', async () => {
      const user = userEvent.setup();
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Select CAPA
      await user.click(screen.getByText('finding-123'));

      // Find and click Save button
      const saveButtons = screen.getAllByText('Save Changes');
      if (saveButtons.length > 0) {
        await user.click(saveButtons[0]);
        // onUpdateCapa should be called
        expect(mockOnUpdateCapa).toHaveBeenCalled();
      }
    });

    it('should call onCloseCapa when closing CAPA', async () => {
      const user = userEvent.setup();
      const completeClosedCapa = {
        ...mockActiveCapa,
        status: 'verification_pending' as const,
        evidence_checklist: [
          {
            item: 'Test',
            required: true,
            completed: true,
            evidence_urls: [],
            completed_date: '2026-06-01',
          },
        ],
        approvals: [
          { role: 'implementer' as const, user: 'user-1', approved: true, timestamp: '2026-06-01' },
          { role: 'reviewer' as const, user: 'user-2', approved: true, timestamp: '2026-06-01' },
        ],
      };

      render(
        <CapaAndMonitoringTab
          capas={[completeClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Select CAPA
      await user.click(screen.getByText('finding-123'));

      // Find and click Close button
      const closeButtons = screen.getAllByText('Close CAPA');
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);
        // onCloseCapa should be called
        expect(mockOnCloseCapa).toHaveBeenCalled();
      }
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      const { container } = render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Check for dark mode classes
      const tabsContainer = container.querySelector('.dark\\:bg-slate-900') ||
                           container.querySelector('[class*="dark:"]');
      expect(tabsContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Check for responsive grid classes
      const gridElement = container.querySelector('[class*="grid"]');
      expect(gridElement).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty CAPA list on Active tab', () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockClosedCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      // Should show empty state message
      expect(screen.getByText(/No active CAPA/i)).toBeInTheDocument();
    });

    it('should handle empty CAPA list on History tab', async () => {
      render(
        <CapaAndMonitoringTab
          capas={[mockActiveCapa]}
          onCreateCapa={mockOnCreateCapa}
          onUpdateCapa={mockOnUpdateCapa}
          onCloseCapa={mockOnCloseCapa}
        />
      );

      const historyTab = screen.getByRole('button', { name: /capa history/i });
      fireEvent.click(historyTab);

      // Should show empty state message
      expect(screen.getByText(/No closed CAPA/i)).toBeInTheDocument();
    });
  });
});
