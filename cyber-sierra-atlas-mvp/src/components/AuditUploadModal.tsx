import React, { useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Finding } from '../lib/schema';
import { extractAuditFindings, parseManualFinding } from '../lib/parser';
import { validateManualEntry, ValidationResult } from '../lib/audit-validation';
import { ManualFindingInput } from '../lib/audit-types';

interface AuditUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParsedFindings: (findings: Finding[]) => void;
}

type TabType = 'upload' | 'manual';
type LoadingState = 'idle' | 'extracting' | 'success' | 'error';

export function AuditUploadModal({ isOpen, onClose, onParsedFindings }: AuditUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Audit Findings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload report or enter findings manually</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-cs-navy text-cs-navy dark:border-cs-cyan-500 dark:text-cs-cyan-500'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload size={16} className="inline mr-2" /> Upload Report
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-cs-navy text-cs-navy dark:border-cs-cyan-500 dark:text-cs-cyan-500'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={16} className="inline mr-2" /> Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'upload' && (
            <UploadTab onParsedFindings={onParsedFindings} onClose={onClose} setLoadingState={setLoadingState} setError={setError} loadingState={loadingState} error={error} />
          )}
          {activeTab === 'manual' && (
            <ManualEntryTab onParsedFindings={onParsedFindings} onClose={onClose} setLoadingState={setLoadingState} setError={setError} loadingState={loadingState} error={error} />
          )}
        </div>
      </div>
    </div>
  );
}

interface TabProps {
  onParsedFindings: (findings: Finding[]) => void;
  onClose: () => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: string) => void;
  loadingState: LoadingState;
  error: string;
}

function UploadTab({ onParsedFindings, onClose, setLoadingState, setError, loadingState, error }: TabProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.includes('xlsx') && !file.name.includes('xls') && !file.name.includes('json') && !file.name.includes('docx')) {
      setError('Unsupported file format. Please upload PDF, Excel, JSON, or Word documents.');
      return;
    }

    setLoadingState('extracting');
    setError('');

    try {
      const findings = await extractAuditFindings(file);
      setLoadingState('success');
      setTimeout(() => {
        onParsedFindings(findings);
        onClose();
      }, 1000);
    } catch (err) {
      setLoadingState('error');
      setError(err instanceof Error ? err.message : 'Failed to extract findings from file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {loadingState === 'idle' && (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-cs-navy bg-cs-navy/5 dark:border-cs-cyan-500 dark:bg-cs-cyan-500/5'
                : 'border-slate-300 dark:border-slate-600 hover:border-cs-navy dark:hover:border-cs-cyan-500'
            }`}
          >
            <Upload size={32} className="mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-900 dark:text-white mb-1">
              Drag & drop your report here
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              or
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.json,.docx,.doc"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                className="hidden"
              />
              <span className="px-4 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white rounded-lg font-medium cursor-pointer hover:bg-cs-navy-700 transition-colors">
                Browse Files
              </span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              PDF, Excel, JSON, Word (up to 25MB)
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </>
      )}

      {loadingState === 'extracting' && (
        <div className="text-center py-12">
          <Loader2 size={40} className="mx-auto mb-4 text-cs-navy dark:text-cs-cyan-500 animate-spin" />
          <p className="font-medium text-slate-900 dark:text-white">Extracting findings...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment</p>
        </div>
      )}

      {loadingState === 'success' && (
        <div className="text-center py-12">
          <CheckCircle size={40} className="mx-auto mb-4 text-green-500" />
          <p className="font-medium text-slate-900 dark:text-white">Extraction complete!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Findings ready for review</p>
        </div>
      )}

      {loadingState === 'error' && (
        <div className="text-center py-12">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <p className="font-medium text-slate-900 dark:text-white">Extraction failed</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => setLoadingState('idle')}
            className="px-4 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white rounded-lg font-medium hover:bg-cs-navy-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function ManualEntryTab({ onParsedFindings, onClose, setLoadingState, setError, loadingState, error }: TabProps) {
  const [formData, setFormData] = useState<ManualFindingInput>({
    title: '',
    description: '',
    severity: 'High',
    auditReportType: 'pen-test',
  });
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [] });

  const handleInputChange = (field: keyof ManualFindingInput, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Real-time validation
    const result = validateManualEntry(updated);
    setValidation(result);
  };

  const handleSubmit = () => {
    const result = validateManualEntry(formData);
    if (!result.valid) {
      setValidation(result);
      return;
    }

    setLoadingState('extracting');
    setError('');

    try {
      const finding = parseManualFinding(formData);
      setLoadingState('success');
      setTimeout(() => {
        onParsedFindings([finding]);
        onClose();
      }, 1000);
    } catch (err) {
      setLoadingState('error');
      setError(err instanceof Error ? err.message : 'Failed to create finding');
    }
  };

  if (loadingState === 'extracting') {
    return (
      <div className="text-center py-12">
        <Loader2 size={40} className="mx-auto mb-4 text-cs-navy dark:text-cs-cyan-500 animate-spin" />
        <p className="font-medium text-slate-900 dark:text-white">Creating finding...</p>
      </div>
    );
  }

  if (loadingState === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle size={40} className="mx-auto mb-4 text-green-500" />
        <p className="font-medium text-slate-900 dark:text-white">Finding created!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ready for import</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., SQL Injection vulnerability"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cs-navy dark:focus:border-cs-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Detailed description of the finding..."
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cs-navy dark:focus:border-cs-cyan-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Severity <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.severity}
            onChange={(e) => handleInputChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cs-navy dark:focus:border-cs-cyan-500"
          >
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Report Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.auditReportType}
            onChange={(e) => handleInputChange('auditReportType', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cs-navy dark:focus:border-cs-cyan-500"
          >
            <option value="pen-test">Pen Test</option>
            <option value="external-audit">External Audit</option>
            <option value="risk-assessment">Risk Assessment</option>
            <option value="vulnerability-scan">Vulnerability Scan</option>
            <option value="internal-audit">Internal Audit</option>
            <option value="incident">Incident</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Asset Name
        </label>
        <input
          type="text"
          value={formData.assetName || ''}
          onChange={(e) => handleInputChange('assetName', e.target.value)}
          placeholder="e.g., API Server"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cs-navy dark:focus:border-cs-cyan-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Please fix:</p>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {validation.errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setFormData({
            title: '',
            description: '',
            severity: 'High',
            auditReportType: 'pen-test',
          })}
          className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!validation.valid}
          className="flex-1 px-4 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white font-medium rounded-lg hover:bg-cs-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Finding
        </button>
      </div>
    </div>
  );
}
