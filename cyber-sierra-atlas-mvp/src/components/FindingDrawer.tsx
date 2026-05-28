import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, AlertCircle, CheckCircle2, Globe, User, Calendar, Wand2, Copy, Download, Loader2, Paperclip, Trash, Wrench, Edit2, Check, CheckCircle } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { validateFinding } from '../lib/validation';
import { generateRemediationPlan } from '../lib/llm';
import { Finding } from '../lib/schema';

interface FindingDrawerProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FindingDrawer({ finding, isOpen, onClose }: FindingDrawerProps) {
  const { dispatch } = useStore();
  const [formState, setFormState] = useState<Finding | null>(null);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  const [remediationPlan, setRemediationPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remediationError, setRemediationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditingRemediation, setIsEditingRemediation] = useState(false);
  const [remediationEditValue, setRemediationEditValue] = useState('');

  useEffect(() => {
    if (finding) {
      setFormState({ ...finding });
      setValidationIssues(validateFinding(finding));
    }
  }, [finding]);

  const handleInputChange = (field: keyof Finding, value: any) => {
    if (!formState) return;
    const newState = { ...formState, [field]: value };
    setFormState(newState);
    setValidationIssues(validateFinding(newState));
  };

  const handleSave = () => {
    if (!formState) return;
    const errors = validationIssues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      alert(`Cannot save: ${errors.length} blocking errors found.`);
      return;
    }
    
    dispatch({ type: 'UPDATE_FINDING', payload: formState });
    onClose();
  };

  const handleDelete = () => {
    if (!finding) return;
    if (confirm('Are you sure you want to delete this finding? This cannot be undone.')) {
      dispatch({ type: 'DELETE_FINDING', payload: finding.id });
      onClose();
    }
  };

  const handleGenerateRemediationPlan = async () => {
    if (!formState) return;
    setIsGenerating(true);
    setRemediationError(null);
    try {
      const plan = await generateRemediationPlan(formState);
      setRemediationPlan(plan);
    } catch (error) {
      setRemediationError(error instanceof Error ? error.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPlan = () => {
    if (!remediationPlan) return;
    navigator.clipboard.writeText(remediationPlan).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPlan = () => {
    if (!remediationPlan) return;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(remediationPlan));
    element.setAttribute('download', `remediation-plan-${formState?.id}-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const closePlan = () => {
    setRemediationPlan(null);
    setRemediationError(null);
  };

  const handleAddEvidence = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !formState) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      setUploadError(`File too large. Maximum size is 5MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1] || '';
      const evidence = {
        id: `ev-${Date.now()}`,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        data_base64: base64,
        uploaded_at: new Date().toISOString(),
      };

      const updated = {
        ...formState,
        evidence: [...(formState.evidence || []), evidence],
      };
      setFormState(updated);
      setValidationIssues(validateFinding(updated));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    if (!formState) return;
    const updated = {
      ...formState,
      evidence: (formState.evidence || []).filter(e => e.id !== evidenceId),
    };
    setFormState(updated);
    setValidationIssues(validateFinding(updated));
  };

  if (!isOpen || !formState) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cs-light dark:bg-slate-700 rounded-lg text-cs-navy dark:text-cs-cyan-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Finding Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formState.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <CheckCircle2 size={14} /> Core Information
            </div>
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Title</label>
                <input 
                  type="text" 
                  value={formState.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Description</label>
                <textarea 
                  rows={4}
                  value={formState.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Globe size={14} /> Classification & Risk
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Severity</label>
                <select 
                  value={formState.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Informational">Informational</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</label>
                <select 
                  value={formState.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Risk Accepted">Risk Accepted</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Asset Name</label>
              <input 
                type="text" 
                value={formState.asset_name || ''}
                onChange={(e) => handleInputChange('asset_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <User size={14} /> Logistics & Ownership
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Owner</label>
                <input 
                  type="text" 
                  value={formState.owner || ''}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date" 
                    value={formState.due_date || ''}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <AlertCircle size={14} /> Root Cause Analysis
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">RCA (5-10 sentences)</label>
                <textarea
                  rows={4}
                  value={formState.root_cause || ''}
                  onChange={(e) => handleInputChange('root_cause', e.target.value)}
                  placeholder="Describe the root cause of this finding (5-10 sentences). Include: What went wrong, Why it happened, Where the gap is..."
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20 text-sm"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Optional: Help teams understand the underlying cause, not just the symptom.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">RCA Category (Optional)</label>
                <select
                  value={formState.rca_category || ''}
                  onChange={(e) => handleInputChange('rca_category', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cs-navy/20"
                >
                  <option value="">-- Select Category --</option>
                  <option value="Configuration">Configuration Error</option>
                  <option value="Missing Patch">Missing Security Patch</option>
                  <option value="Weak Controls">Weak Security Controls</option>
                  <option value="Design Flaw">Design Flaw</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Paperclip size={14} /> Evidence Vault
            </div>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.zip"
              />
              <button
                onClick={handleAddEvidence}
                className="w-full px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-center gap-2"
              >
                <Paperclip size={16} />
                Attach Evidence File (Max 5MB)
              </button>

              {uploadError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                  {uploadError}
                </div>
              )}

              {(formState?.evidence || []).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {formState?.evidence?.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/30 rounded border border-slate-200 dark:border-slate-600">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <Paperclip size={14} className="text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-900 dark:text-white truncate">{file.filename}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {(file.size_bytes / 1024).toFixed(1)}KB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveEvidence(file.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Wrench size={14} /> Remediation Plan
            </div>

            {/* AI Suggestion Display */}
            {formState.remediation_suggested && !isEditingRemediation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase">
                  AI Suggestion (Claude)
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {formState.remediation_suggested}
                </p>
              </div>
            )}

            {/* Confirmed Remediation Display */}
            {formState.remediation_confirmed && !isEditingRemediation && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-green-700 dark:text-green-300" />
                  <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">
                    Confirmed Plan
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {formState.remediation_confirmed}
                </p>
                {formState.remediation_last_modified_by && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Last modified by {formState.remediation_last_modified_by} at{' '}
                    {new Date(formState.remediation_last_modified_at || '').toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Edit Mode */}
            {isEditingRemediation ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={remediationEditValue}
                  onChange={(e) => setRemediationEditValue(e.target.value)}
                  placeholder="Enter your approved remediation plan..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleInputChange('remediation_confirmed', remediationEditValue);
                      handleInputChange('remediation_last_modified_by', 'current-user');
                      handleInputChange('remediation_last_modified_at', new Date().toISOString());
                      setIsEditingRemediation(false);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Confirm Plan
                  </button>
                  <button
                    onClick={() => setIsEditingRemediation(false)}
                    className="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white py-2 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setRemediationEditValue(formState.remediation_confirmed || formState.remediation_suggested || '');
                  setIsEditingRemediation(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Edit2 size={16} />
                {formState.remediation_confirmed ? 'Edit Confirmed Plan' : 'Confirm & Edit Plan'}
              </button>
            )}
          </section>

          {validationIssues.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase">
                <AlertCircle size={14} /> Quality Alerts
              </div>
              <div className="space-y-1">
                {validationIssues.map(i => (
                  <div key={i.rule} className={`text-xs flex gap-2 ${i.severity === 'error' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    <span>•</span> {i.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white text-sm font-bold rounded-lg hover:bg-cs-navy-700 transition-all shadow-lg shadow-cs-navy/20"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Remediation Plan Modal */}
      {remediationPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closePlan}
          />
          <div className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remediation Plan: {formState?.title}</h3>
              <button onClick={closePlan} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {remediationError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex gap-3 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error generating plan</p>
                  <p className="text-xs mt-1">{remediationError}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">{remediationPlan}</pre>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex gap-3">
                <button
                  onClick={handleCopyPlan}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={handleDownloadPlan}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Download as text file"
                >
                  <Download size={16} /> Download
                </button>
              </div>
              {copied && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied to clipboard</span>
              )}
              <button
                onClick={closePlan}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
