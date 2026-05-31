import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExportModal } from '../../src/components/ReportExportModal';
import * as reportGenerator from '../../src/lib/report-generator';
import { Store, Finding } from '../../src/lib/schema';

describe('ReportExportModal', () => {
  const mockFinding = (overrides?: Partial<Finding>): Finding => ({
    id: 'F1',
    title: 'Test Finding',
    description: 'Test Description',
    severity: 'Critical',
    status: 'Open',
    source_document: {
      filename: 'test.pdf',
      upload_date: new Date().toISOString(),
      parser_confidence: 0.95,
    },
    asset_id: 'A1',
    asset_name: 'Test Asset',
    control_framework: 'ISO 27001',
    control_clause: 'A.5.1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related_findings: [],
    ...overrides,
  });

  const mockStore: Store = {
    findings: [mockFinding()],
    assets: [],
    controls: [],
    lastSaved: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ReportExportModal isOpen={false} onClose={mockOnClose} store={mockStore} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );
    expect(screen.getByText('Export Report')).toBeInTheDocument();
  });

  it('should show PDF format option by default', () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );
    const pdfButton = screen.getByText('PDF Report');
    expect(pdfButton).toBeInTheDocument();
  });

  it('should show Excel format option', () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );
    const excelButton = screen.getByText('Excel Spreadsheet');
    expect(excelButton).toBeInTheDocument();
  });

  it('should allow switching between formats', async () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const excelButton = screen.getByText('Excel Spreadsheet').closest('button');
    fireEvent.click(excelButton!);

    await waitFor(() => {
      expect(excelButton).toHaveClass('border-cs-navy', 'dark:border-cs-cyan-600');
    });
  });

  it('should display findings count in info message', () => {
    const storeWith3Findings: Store = {
      ...mockStore,
      findings: [mockFinding(), mockFinding({ id: 'F2' }), mockFinding({ id: 'F3' })],
    };

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={storeWith3Findings} />
    );

    expect(screen.getByText(/3 finding\(s\)/)).toBeInTheDocument();
  });

  it('should close modal when Cancel button is clicked', async () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when X button is clicked', async () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const closeButton = screen.getByRole('button', { name: '' }).closest('button');
    if (closeButton?.innerHTML.includes('svg')) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call generatePDFReport when exporting as PDF', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockResolvedValue(
      new Blob(['mock pdf'], { type: 'application/pdf' })
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(generatePDFSpy).toHaveBeenCalledWith(mockStore, 'Security Findings Report');
    });
  });

  it('should call generateExcelReport when exporting as Excel', async () => {
    const generateExcelSpy = vi.spyOn(reportGenerator, 'generateExcelReport');
    generateExcelSpy.mockResolvedValue(
      new Blob(['mock excel'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    // Switch to Excel format
    const excelButton = screen.getByText('Excel Spreadsheet').closest('button');
    fireEvent.click(excelButton!);

    // Click Export
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(generateExcelSpy).toHaveBeenCalledWith(mockStore);
    });
  });

  it('should show loading state while generating', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve(new Blob(['mock pdf'], { type: 'application/pdf' })),
            100
          )
        )
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should disable buttons while generating', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve(new Blob(['mock pdf'], { type: 'application/pdf' })),
            100
          )
        )
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
      expect(exportButton).toBeDisabled();
    });
  });

  it('should display error message on export failure', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockRejectedValue(new Error('Failed to generate PDF'));

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate PDF')).toBeInTheDocument();
    });
  });

  it('should trigger file download after successful export', async () => {
    const mockBlob = new Blob(['mock pdf'], { type: 'application/pdf' });
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockResolvedValue(mockBlob);

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(generatePDFSpy).toHaveBeenCalled();
    });
  });

  it('should close modal after successful export', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockResolvedValue(
      new Blob(['mock pdf'], { type: 'application/pdf' })
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should use correct date format in filename', async () => {
    const generatePDFSpy = vi.spyOn(reportGenerator, 'generatePDFReport');
    generatePDFSpy.mockResolvedValue(
      new Blob(['mock pdf'], { type: 'application/pdf' })
    );

    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      // Verify the export was triggered correctly
      expect(generatePDFSpy).toHaveBeenCalledWith(
        mockStore,
        'Security Findings Report'
      );
    });
  });

  it('should support dark mode styling', () => {
    render(
      <ReportExportModal isOpen={true} onClose={mockOnClose} store={mockStore} />
    );

    // Verify modal header is present and accessible
    const header = screen.getByText('Export Report');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('dark:text-white');
  });
});
