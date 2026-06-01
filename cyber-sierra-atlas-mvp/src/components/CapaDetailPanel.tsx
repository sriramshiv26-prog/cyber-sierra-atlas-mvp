import React, { useState } from 'react';
import { CapaWorkflow, EvidenceItem } from '../types/capa';

interface CapaDetailPanelProps {
  capa: CapaWorkflow;
  onSave: (capa: CapaWorkflow) => void;
  readonly?: boolean;
}

export const CapaDetailPanel: React.FC<CapaDetailPanelProps> = ({
  capa,
  onSave,
  readonly = false,
}) => {
  const [formData, setFormData] = useState(capa);
  const [activeSection, setActiveSection] = useState<'rca' | 'action' | 'evidence' | 'timeline'>('rca');

  const handleRcaChange = (field: keyof typeof capa.rca, value: any) => {
    setFormData({
      ...formData,
      rca: { ...formData.rca, [field]: value },
    });
  };

  const handleActionPlanChange = (field: keyof typeof capa.action_plan, value: string) => {
    setFormData({
      ...formData,
      action_plan: { ...formData.action_plan, [field]: value },
    });
  };

  const handleAddRootCause = () => {
    setFormData({
      ...formData,
      rca: {
        ...formData.rca,
        root_causes: [...formData.rca.root_causes, { description: '', evidence_urls: [] }],
      },
    });
  };

  const handleRootCauseChange = (index: number, description: string) => {
    const updated = [...formData.rca.root_causes];
    updated[index].description = description;
    setFormData({
      ...formData,
      rca: { ...formData.rca, root_causes: updated },
    });
  };

  const handleRemoveRootCause = (index: number) => {
    const updated = formData.rca.root_causes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      rca: { ...formData.rca, root_causes: updated },
    });
  };

  const handleEvidenceCheckChange = (index: number, completed: boolean) => {
    const updated = [...formData.evidence_checklist];
    updated[index].completed = completed;
    updated[index].completed_date = completed ? new Date().toISOString() : undefined;
    setFormData({
      ...formData,
      evidence_checklist: updated,
    });
  };

  const handleApprovalCheckChange = (index: number, approved: boolean) => {
    const updated = [...formData.approvals];
    updated[index].approved = approved;
    updated[index].timestamp = approved ? new Date().toISOString() : undefined;
    setFormData({
      ...formData,
      approvals: updated,
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-white">
          CAPA Workflow: {capa.finding_id}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Framework: {capa.framework} | Type: {capa.type} | Status: {capa.status}
        </p>
      </div>

      {/* Section Tabs */}
      <div className="mb-6 flex border-b dark:border-gray-700">
        {['rca', 'action', 'evidence', 'timeline'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSection === section
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            disabled={readonly}
          >
            {section === 'rca' && 'Root Cause Analysis'}
            {section === 'action' && 'Action Plan'}
            {section === 'evidence' && 'Evidence & Approval'}
            {section === 'timeline' && 'Timeline'}
          </button>
        ))}
      </div>

      {/* RCA Section */}
      {activeSection === 'rca' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Root Cause Analysis</h3>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Problem Statement *
            </label>
            <textarea
              value={formData.rca.problem_statement}
              onChange={(e) => handleRcaChange('problem_statement', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              placeholder="What went wrong?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Investigation Data *
            </label>
            <textarea
              value={formData.rca.investigation_data}
              onChange={(e) => handleRcaChange('investigation_data', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              placeholder="Findings from investigation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Root Causes *
            </label>
            {formData.rca.root_causes.map((rc, idx) => (
              <div key={idx} className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                <textarea
                  value={rc.description}
                  onChange={(e) => handleRootCauseChange(idx, e.target.value)}
                  disabled={readonly}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={2}
                  placeholder="Root cause description"
                />
                {!readonly && (
                  <button
                    onClick={() => handleRemoveRootCause(idx)}
                    className="mt-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {!readonly && (
              <button
                onClick={handleAddRootCause}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Root Cause
              </button>
            )}
          </div>

          {!readonly && (
            <button
              onClick={handleSave}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Action Plan Section */}
      {activeSection === 'action' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Action Plan</h3>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.action_plan.description}
              onChange={(e) => handleActionPlanChange('description', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              placeholder="What will we do to fix it?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Owner *
            </label>
            <input
              type="text"
              value={formData.action_plan.owner}
              onChange={(e) => handleActionPlanChange('owner', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="User ID or name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Target Date *
            </label>
            <input
              type="date"
              value={formData.action_plan.target_date}
              onChange={(e) => handleActionPlanChange('target_date', e.target.value)}
              disabled={readonly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {!readonly && (
            <button
              onClick={handleSave}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Evidence & Approval Section */}
      {activeSection === 'evidence' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Evidence & Approval</h3>

          <div>
            <h4 className="font-medium dark:text-gray-300 mb-3">Evidence Checklist</h4>
            {formData.evidence_checklist.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No evidence items defined yet.</p>
            ) : (
              formData.evidence_checklist.map((item, idx) => (
                <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => handleEvidenceCheckChange(idx, e.target.checked)}
                      disabled={readonly}
                      className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="dark:text-gray-300">{item.item}</span>
                    {item.required && <span className="text-xs text-red-600">required</span>}
                  </label>
                  {item.completed_date && (
                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                      Completed: {new Date(item.completed_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div>
            <h4 className="font-medium dark:text-gray-300 mb-3">Approvals</h4>
            {formData.approvals.map((approval, idx) => (
              <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approval.approved}
                    onChange={(e) => handleApprovalCheckChange(idx, e.target.checked)}
                    disabled={readonly}
                    className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="dark:text-gray-300">
                    {approval.role === 'implementer' ? 'Implementer' : 'Reviewer'} Approval
                  </span>
                </label>
                {approval.timestamp && (
                  <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                    {approval.user} on {new Date(approval.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {!readonly && (
            <button
              onClick={handleSave}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>
      )}

      {/* Timeline Section */}
      {activeSection === 'timeline' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
              <span>RCA Due:</span>
              <span className="font-medium">{formData.timeline.rca_due}</span>
            </div>
            {formData.timeline.action_completion_date && (
              <div className="flex justify-between items-center text-sm dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <span>RCA Completed:</span>
                <span className="font-medium">{formData.timeline.action_completion_date}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
              <span>Action Due:</span>
              <span className="font-medium">{formData.timeline.action_due}</span>
            </div>
            {formData.timeline.action_completion_date && (
              <div className="flex justify-between items-center text-sm dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <span>Action Completed:</span>
                <span className="font-medium">{formData.timeline.action_completion_date}</span>
              </div>
            )}
            {formData.timeline.verification_due && (
              <div className="flex justify-between items-center text-sm dark:text-gray-300 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                <span>Verification Due:</span>
                <span className="font-medium">{formData.timeline.verification_due}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
