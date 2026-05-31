import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Store } from '../lib/schema';
import { exportStore, importStore, downloadFile } from '../lib/data-export';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  onImport: (newStore: Store) => void;
  onClearAll: () => void;
  isDarkMode?: boolean;
}

export function DataManagementModal({
  isOpen,
  onClose,
  store,
  onImport,
  onClearAll,
  isDarkMode = false,
}: DataManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleExportBackup = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `cyber-sierra-backup-${timestamp}.json`;
      const content = exportStore(store);
      downloadFile(content, filename, 'application/json');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export backup');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      setImportSuccess(false);
      const content = await file.text();
      const result = importStore(content);

      if (!result.success) {
        setImportError(result.errors.join(', '));
        return;
      }

      if (result.store) {
        onImport(result.store);
        setImportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setImportError(`Failed to read file: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearConfirmed = () => {
    onClearAll();
    setShowClearConfirmation(false);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const bgClass = isDarkMode ? 'bg-slate-900' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const hoverBgClass = isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
  const buttonBgClass = isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300';
  const dangerBgClass = isDarkMode ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200';
  const dangerTextClass = isDarkMode ? 'text-red-200' : 'text-red-800';
  const modalOverlayClass = isDarkMode ? 'bg-black/50' : 'bg-black/30';

  return (
    <>
      {/* Modal Overlay */}
      <div
        className={`fixed inset-0 ${modalOverlayClass} z-40 flex items-center justify-center`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}
        onClick={onClose}
      >
        <div
          className={`${bgClass} ${textClass} rounded-lg shadow-xl max-w-md w-full mx-4 p-6 pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">Data Management</h2>

          {showClearConfirmation ? (
            // Clear Confirmation View
            <div className={`border-l-4 border-red-500 ${dangerBgClass} ${dangerTextClass} p-4 rounded mb-4`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Confirm Clear All Data</p>
                  <p className="text-sm mt-1 opacity-90">
                    This will permanently delete all findings, assets, and controls. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className={`flex-1 px-4 py-2 rounded ${buttonBgClass} ${textClass} font-medium text-sm transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearConfirmed}
                  className="flex-1 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : importSuccess ? (
            // Import Success View
            <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded mb-4">
              <p className="font-bold">Import Successful</p>
              <p className="text-sm mt-1">Your backup has been restored.</p>
            </div>
          ) : (
            // Main View
            <>
              {importError && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded mb-4 text-sm">
                  {importError}
                </div>
              )}

              <div className="space-y-3">
                {/* Export Button */}
                <button
                  onClick={handleExportBackup}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded border ${borderClass} ${hoverBgClass} ${textClass} font-medium transition-colors`}
                >
                  <Download className="w-4 h-4" />
                  Export Backup
                </button>

                {/* Import Button */}
                <button
                  onClick={handleImportClick}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded border ${borderClass} ${hoverBgClass} ${textClass} font-medium transition-colors`}
                >
                  <Upload className="w-4 h-4" />
                  Import Backup
                </button>

                {/* Clear All Button */}
                <button
                  onClick={() => setShowClearConfirmation(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded ${dangerBgClass} ${dangerTextClass} font-medium transition-colors`}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              </div>

              {/* Data Summary */}
              <div className={`mt-6 pt-6 border-t ${borderClass} text-sm`}>
                <div className={`grid grid-cols-3 gap-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="text-center">
                    <div className="font-bold text-lg">{store.findings.length}</div>
                    <div>Findings</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{store.assets.length}</div>
                    <div>Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{store.controls.length}</div>
                    <div>Controls</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Close Button */}
          {!showClearConfirmation && !importSuccess && (
            <button
              onClick={onClose}
              className={`w-full mt-6 px-4 py-2 rounded ${buttonBgClass} ${textClass} font-medium transition-colors`}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Import backup file"
      />
    </>
  );
}
