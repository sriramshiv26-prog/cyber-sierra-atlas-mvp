import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { findExactDuplicates, findSemanticDuplicates } from '../lib/deduplication';
import { validateAllFindings, getValidFindings } from '../lib/validation';
import { Finding } from '../lib/schema';

interface SmartIngestPreviewProps {
  findings: Finding[];
  onApprove: (finalFindings: Finding[]) => void;
  onCancel: () => void;
}

export function SmartIngestPreview({ findings, onApprove, onCancel }: SmartIngestPreviewProps) {
  const [mergedIds, setMergedIds] = useState<Set<string>>(new Set());

  // Core Analysis
  const validationIssues = validateAllFindings(findings);
  const exactDups = findExactDuplicates(findings);
  const semanticDups = findSemanticDuplicates(findings);
  
  // Actual data split
  const validFindings = getValidFindings(findings);
  const invalidIds = new Set(
    validationIssues.filter(i => i.severity === 'error').map(i => i.finding_id)
  );

  function toggleMerge(id: string) {
    setMergedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApprove() {
    // 1. Filter out errors
    const baseSet = findings.filter(f => !invalidIds.has(f.id));
    
    // 2. Filter out findings the user chose to merge (hide)
    const finalSet = baseSet.filter(f => !mergedIds.has(f.id));
    
    onApprove(finalSet);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Ingest Preview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review AI-extracted findings before committing to the register.</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
          <StatTile label="Total Extracted" value={findings.length} color="blue" />
          <StatTile label="Valid" value={validFindings.length} color="green" />
          <StatTile label="Blocking Errors" value={invalidIds.size} color="red" />
          <StatTile label="Potential Dups" value={exactDups.length + semanticDups.length} color="yellow" />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          
          {/* Section: Blocking Errors */}
          {invalidIds.size > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
                <AlertCircle size={16} /> Blocking Validation Errors
              </h3>
              <div className="grid gap-3">
                {findings.filter(f => invalidIds.has(f.id)).map(f => (
                  <div key={f.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900 dark:text-white">{f.title}</span>
                      <span className="text-xs font-mono px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded">ID: {f.id}</span>
                    </div>
                    <ul className="space-y-1">
                      {validationIssues.filter(i => i.finding_id === f.id && i.severity === 'error').map(i => (
                        <li key={i.rule} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          • {i.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Duplicate Review */}
          {(exactDups.length > 0 || semanticDups.length > 0) && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-4">
                <AlertTriangle size={16} /> Duplicate Analysis
              </h3>
              <div className="space-y-4">
                {[...exactDups, ...semanticDups].map((dup, idx) => {
                  const f1 = findings.find(f => f.id === dup.finding1);
                  const f2 = findings.find(f => f.id === dup.finding2);
                  if (!f1 || !f2) return null;

                  return (
                    <div key={idx} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-500">{dup.reason}</span>
                        <span className="text-xs font-bold">{Math.round(dup.confidence * 100)}% Confidence</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <FindingMiniCard finding={f1} />
                        <ArrowRight size={16} className="text-slate-400" />
                        <FindingMiniCard 
                          finding={f2} 
                          isMergeCandidate 
                          isMerged={mergedIds.has(f2.id)} 
                          onToggle={() => toggleMerge(f2.id)} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section: New Clean Findings */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-2 mb-4">
              <CheckCircle size={16} /> Ready to Import
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {findings.filter(f => !invalidIds.has(f.id)).map(f => (
                <div key={f.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{f.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.severity} • {f.asset_name}</p>
                  </div>
                  <div className="flex gap-2">
                    {validationIssues.filter(i => i.finding_id === f.id && i.severity === 'warning').map(i => (
                      <div key={i.rule} title={i.message} className="w-2 h-2 rounded-full bg-yellow-500" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Discard All
          </button>
          <button 
            onClick={handleApprove}
            className="px-6 py-2 bg-cs-navy dark:bg-cs-cyan-600 text-white text-sm font-bold rounded-lg hover:bg-cs-navy-700 transition-all shadow-lg shadow-cs-navy/20"
          >
            Import {findings.length - invalidIds.size - mergedIds.size} Findings
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };
  return (
    <div className="px-4 py-3 bg-white dark:bg-slate-800 text-center">
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{label}</div>
    </div>
  );
}

function FindingMiniCard({ finding, isMergeCandidate, isMerged, onToggle }: { 
  finding: Finding; 
  isMergeCandidate?: boolean; 
  isMerged?: boolean; 
  onToggle?: () => void 
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all flex-1 ${
      isMergeCandidate 
        ? (isMerged ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600') 
        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
    }`}>
      <p className="text-xs font-bold truncate max-w-[120px]">{finding.title}</p>
      {isMergeCandidate && (
        <button 
          onClick={onToggle}
          className={`text-[10px] mt-1 px-2 py-0.5 rounded ${
            isMerged ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
          }`}
        >
          {isMerged ? 'Marked for Merge' : 'Mark as Duplicate'}
        </button>
      )}
    </div>
  );
}
