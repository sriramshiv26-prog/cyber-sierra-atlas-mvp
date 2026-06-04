import React, { useState } from 'react';
import { CapaWorkflow, EvidenceItem, CapaStatus } from '../types/capa';

interface CapaDetailPanelProps {
  capa: CapaWorkflow;
  onSave: (capa: CapaWorkflow) => void;
  onClose?: (capaId: string) => void;
  readonly?: boolean;
}

// Valid status transitions based on CAPA workflow state machine
const getValidNextStatuses = (currentStatus: CapaStatus): CapaStatus[] => {
  const transitions: Record<CapaStatus, CapaStatus[]> = {
    'draft': ['rca_pending'],
    'rca_pending': ['rca_completed'],
    'rca_completed': ['plan_approved'],
    'plan_approved': ['implementing'],
    'implementing': ['verification_pending'],
    'verification_pending': ['closed'],
    'closed': [],
  };
  return transitions[currentStatus] || [];
};

export const CapaDetailPanel: React.FC<CapaDetailPanelProps> = ({
  capa,
  onSave,
  onClose,
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

  const handleEvidenceFileUpload = (index: number, files: FileList | null) => {
    if (!files) return;
    const updated = [...formData.evidence_checklist];
    const currentUrls = updated[index].evidence_urls || [];
    // In a real app, these would be uploaded to a server and get real URLs
    // For now, we'll simulate with file names
    const newUrls = Array.from(files).map(
      (file) => `evidence_${Date.now()}_${file.name}`
    );
    updated[index].evidence_urls = [...currentUrls, ...newUrls];
    setFormData({
      ...formData,
      evidence_checklist: updated,
    });
  };

  const handleRemoveEvidenceUrl = (index: number, urlIndex: number) => {
    const updated = [...formData.evidence_checklist];
    updated[index].evidence_urls = updated[index].evidence_urls.filter(
      (_, i) => i !== urlIndex
    );
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

  const handleStatusChange = (newStatus: CapaStatus) => {
    const updated = { ...formData, status: newStatus };
    setFormData(updated);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleClose = () => {
    if (onClose) {
      onClose(capa.id);
    }
  };

  const isAllRequiredSectionsComplete = (): boolean => {
    // Check if all required evidence is completed
    const allEvidenceComplete = formData.evidence_checklist
      .filter((item) => item.required)
      .every((item) => item.completed);

    // Check if all approvals are signed
    const allApprovalsApproved = formData.approvals.every((approval) => approval.approved);

    return allEvidenceComplete && allApprovalsApproved;
  };

  const validNextStatuses = getValidNextStatuses(formData.status);

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

          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!formData.rca.rca_completed_date}
                onChange={(e) => {
                  const updatedRca = { ...formData.rca };
                  if (e.target.checked) {
                    updatedRca.rca_completed_date = new Date().toISOString();
                    updatedRca.rca_completed_by = 'current-user';
                  } else {
                    updatedRca.rca_completed_date = undefined;
                    updatedRca.rca_completed_by = undefined;
                  }
                  setFormData({
                    ...formData,
                    rca: updatedRca,
                  });
                }}
                disabled={readonly}
                className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="font-medium dark:text-gray-200">Mark RCA as Completed</span>
            </label>
            {formData.rca.rca_completed_date && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Completed by {formData.rca.rca_completed_by} on{' '}
                {new Date(formData.rca.rca_completed_date).toLocaleDateString()}
              </p>
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
                <div key={idx} className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2 mb-3">
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

                  {/* File Upload Section */}
                  {!readonly && (
                    <div className="mb-3 ml-6">
                      <label className="block text-xs font-medium dark:text-gray-400 mb-2">
                        Upload Evidence Files
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleEvidenceFileUpload(idx, e.target.files)}
                        className="block w-full text-xs text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-1 file:px-2 file:rounded
                          file:border-0 file:text-xs file:font-medium
                          file:bg-blue-600 file:text-white
                          hover:file:bg-blue-700"
                      />
                    </div>
                  )}

                  {/* Uploaded Files List */}
                  {item.evidence_urls && item.evidence_urls.length > 0 && (
                    <div className="mb-3 ml-6">
                      <p className="text-xs font-medium dark:text-gray-400 mb-2">Uploaded Files:</p>
                      <ul className="space-y-1">
                        {item.evidence_urls.map((url, urlIdx) => (
                          <li
                            key={urlIdx}
                            className="text-xs bg-white dark:bg-slate-700 p-2 rounded flex items-center justify-between"
                          >
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {url.split('_').pop()}
                            </span>
                            {!readonly && (
                              <button
                                onClick={() => handleRemoveEvidenceUrl(idx, urlIdx)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium ml-2"
                              >
                                Delete
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.completed_date && (
                    <p className="text-xs text-gray-600 dark:text-gray-500 ml-6">
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

      {/* Footer with Status Dropdown and Close Button */}
      {!readonly && (
        <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between gap-4">
          {/* Status Change Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium dark:text-gray-300">Change Status:</label>
            <select
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value as CapaStatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-800 dark:text-white text-sm"
            >
              <option value={formData.status}>{formData.status}</option>
              {validNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
            >
              Save All Changes
            </button>

            <button
              onClick={handleClose}
              disabled={!isAllRequiredSectionsComplete()}
              title={
                !isAllRequiredSectionsComplete()
                  ? 'Close CAPA only when all required evidence and approvals are complete'
                  : 'Close this CAPA'
              }
              className={`px-4 py-2 rounded-md font-medium text-sm ${
                isAllRequiredSectionsComplete()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              Close CAPA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
