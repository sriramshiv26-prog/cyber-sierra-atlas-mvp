import React, { useState } from 'react';
import { X, Check, Merge2 } from 'lucide-react';

export function DuplicateModal({ findings, isOpen, onClose, onMerge }) {
  const [selectedMasterId, setSelectedMasterId] = useState(findings[0]?.id);

  if (!isOpen || findings.length === 0) return null;

  const duplicateIds = findings.map(f => f.id).filter(id => id !== selectedMasterId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Manage Duplicates
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">
              Select Master Finding
            </p>
            <div className="space-y-2">
              {findings.map(finding => (
                <label
                  key={finding.id}
                  className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <input
                    type="radio"
                    name="master"
                    value={finding.id}
                    checked={selectedMasterId === finding.id}
                    onChange={(e) => setSelectedMasterId(e.target.value)}
                    className="mt-1 mr-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {finding.title}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {finding.asset_name} • {finding.severity}
                    </div>
                  </div>
                  {selectedMasterId === finding.id && (
                    <Check size={20} className="text-green-500 mt-1" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-4">
              Duplicates to Merge ({duplicateIds.length})
            </p>
            <div className="space-y-2">
              {duplicateIds.map(id => {
                const finding = findings.find(f => f.id === id);
                return (
                  <div
                    key={id}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm"
                  >
                    {finding?.title}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded text-sm text-slate-700 dark:text-slate-300">
            <strong>Result:</strong> The master finding will be marked as unique.
            Duplicates will be linked to it and filtered from normal views.
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              onMerge(selectedMasterId, duplicateIds);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            <Merge2 size={18} />
            Merge Findings
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
