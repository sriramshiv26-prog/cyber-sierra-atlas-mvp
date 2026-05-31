import React, { useState } from 'react';
import { X, Download, FileText, Table, Loader } from 'lucide-react';
import { Store } from '../lib/schema';
import { generatePDFReport, generateExcelReport } from '../lib/report-generator';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
}

/**
 * Trigger download of a Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
}

export function ReportExportModal({ isOpen, onClose, store }: ReportExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `security-report-${timestamp}`;

      if (format === 'pdf') {
        const blob = await generatePDFReport(store, 'Security Findings Report');
        downloadBlob(blob, `${baseFilename}.pdf`);
      } else {
        const blob = await generateExcelReport(store);
        downloadBlob(blob, `${baseFilename}.xlsx`);
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Export Report
          </h2>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-50"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Format Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Select Format
          </label>

          <button
            onClick={() => setFormat('pdf')}
            disabled={isGenerating}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
              format === 'pdf'
                ? 'border-cs-navy dark:border-cs-cyan-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-700'
            }`}
          >
            <FileText
              size={24}
              className={`flex-shrink-0 ${
                format === 'pdf'
                  ? 'text-cs-navy dark:text-cs-cyan-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            <div className="text-left">
              <div className="font-semibold text-slate-900 dark:text-white">
                PDF Report
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Professional formatted report with findings summary
              </div>
            </div>
          </button>

          <button
            onClick={() => setFormat('excel')}
            disabled={isGenerating}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
              format === 'excel'
                ? 'border-cs-navy dark:border-cs-cyan-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-700'
            }`}
          >
            <Table
              size={24}
              className={`flex-shrink-0 ${
                format === 'excel'
                  ? 'text-cs-navy dark:text-cs-cyan-600'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            <div className="text-left">
              <div className="font-semibold text-slate-900 dark:text-white">
                Excel Spreadsheet
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Structured data with summary and detailed findings
              </div>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            The report will include {store.findings.length} finding(s) and be dated{' '}
            {new Date().toLocaleDateString()}.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cs-navy dark:bg-cs-cyan-600 hover:bg-blue-900 dark:hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={18} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
