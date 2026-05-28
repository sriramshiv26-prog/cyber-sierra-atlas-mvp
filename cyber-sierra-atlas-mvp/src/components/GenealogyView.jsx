import React, { useMemo } from 'react';
import { 
  FileText, 
  ArrowRight, 
  ShieldAlert, 
  Server, 
  CheckCircle2,
  Search
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

/**
 * Genealogy View
 * 
 * Traces the lifecycle of a finding from its source document to the final asset mapping.
 * Essential for audit transparency and regulatory compliance.
 */

export function GenealogyView() {
  const { store } = useStore();
  const { findings, assets } = store;

  return (
    <div className="p-8 h-full flex flex-col gap-8 bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Findings Genealogy</h1>
          <p className="text-slate-500 dark:text-slate-400">Tracing the lineage of findings from source to impact.</p>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <FileText size={48} className="mb-4 opacity-20" />
          <p>No findings available to trace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {findings.map(f => {
            const asset = assets.find(a => a.id === f.asset_id) || { name: f.asset_name, type: 'other' };
            
            return (
              <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-cs-cyan-500 transition-all">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  
                  {/* Step 1: Source */}
                  <div className="flex-1 flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 w-full md:w-auto min-w-[200px]">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 mb-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <FileText size={20} />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Source Document</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 truncate max-w-full">
                      {f.source_document.filename}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Confidence: {(f.source_document.parser_confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRight size={24} />
                  </div>
                  <div className="md:hidden flex justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>

                  {/* Step 2: Finding */}
                  <div className="flex-1 flex flex-col items-center text-center p-4 rounded-xl border-2 border-cs-cyan-500/30 bg-cs-light/30 dark:bg-cs-cyan-900/10 w-full md:w-auto min-w-[250px]">
                    <div className="p-2 bg-cs-cyan-500 rounded-full text-white mb-3 shadow-sm">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="text-xs font-bold text-cs-navy dark:text-cs-cyan-400 uppercase mb-1">Finding Record</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-1">
                      {f.title}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium">
                        {f.severity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium">
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRight size={24} />
                  </div>
                  <div className="md:hidden flex justify-center text-slate-300 dark:text-slate-600">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>

                  {/* Step 3: Impact Asset */}
                  <div className="flex-1 flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 w-full md:w-auto min-w-[200px]">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 mb-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <Server size={20} />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Affected Asset</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-full">
                      {asset.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      {asset.type}
                    </div>
                  </div>
                </div>

                {/* RCA Section */}
                {f.root_cause && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400">
                          <ShieldAlert size={18} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Root Cause Analysis</div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {f.root_cause}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
