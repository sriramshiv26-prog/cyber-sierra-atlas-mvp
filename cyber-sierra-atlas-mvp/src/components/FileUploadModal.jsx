import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2, Zap } from 'lucide-react';
import { detectAndParseFile } from '../lib/parser';
import { FINDING_TEMPLATES, createFindingFromTemplate } from '../lib/templates';

export function FileUploadModal({ isOpen, onClose, onParsedFindings }) {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'templates'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit to prevent browser hangs

  const handleFile = useCallback(async (file) => {
    setError(null);
    
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum supported size is 10MB.');
      return;
    }

    setIsLoading(true);

    try {
      const allowedExtensions = ['pdf', 'docx', 'xlsx', 'xls', 'csv', 'json', 'txt'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        throw new Error(`Unsupported file type: .${ext}. Please upload PDF, DOCX, XLSX, CSV, JSON or TXT.`);
      }

      const findings = await detectAndParseFile(file);
      onParsedFindings(findings);
      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while parsing the file');
    } finally {
      setIsLoading(false);
    }
  }, [onParsedFindings, onClose]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreateFromTemplate = (templateId) => {
    const template = FINDING_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Create a partial finding from the template
    const finding = {
      ...template.baseProperties,
      id: `F-${Date.now()}`,
      asset_id: 'unknown',
      asset_name: 'Select Asset',
      status: 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      related_findings: [],
      source_document: {
        filename: 'Manual (Template)',
        upload_date: new Date().toISOString(),
        parser_confidence: 1.0,
      },
    };

    onParsedFindings([finding]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Ingest</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'border-b-2 border-cs-navy dark:border-cs-cyan-400 text-cs-navy dark:text-cs-cyan-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload size={16} /> Upload Document
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'templates'
                ? 'border-b-2 border-cs-navy dark:border-cs-cyan-400 text-cs-navy dark:text-cs-cyan-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap size={16} /> Use Template
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  dragActive
                    ? 'border-cs-cyan-500 bg-cs-light/50 scale-[1.02]'
                    : 'border-slate-300 dark:border-slate-600 hover:border-cs-cyan-500 dark:hover:border-cs-cyan-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.xls,.csv,.json,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-cs-light dark:bg-slate-700 rounded-full text-cs-navy dark:text-cs-cyan-400 group-hover:scale-110 transition-transform">
                    {isLoading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {isLoading ? 'Analyzing Document...' : 'Drop findings file here'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Supported: PDF, DOCX, XLSX, CSV, JSON, plain text
                    </p>
                  </div>

                  {!isLoading && (
                    <button
                      className="mt-2 px-4 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cs-navy-700 transition-colors"
                    >
                      Browse Files
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex gap-3 text-red-700 dark:text-red-400 text-sm animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <FileText size={14} className="mt-0.5 shrink-0" />
                  <p>
                    Our AI will automatically identify vulnerabilities, map assets, and suggest severities.
                    You will be able to review these in the Smart Ingest Preview.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Quick-start a finding using common security vulnerability templates.
              </p>
              {FINDING_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template.id)}
                  className="w-full text-left p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-cs-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-cs-navy dark:group-hover:text-cs-cyan-400 transition-colors">
                      {template.name}
                    </h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      template.baseProperties.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      template.baseProperties.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {template.baseProperties.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
