import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Finding } from '../lib/schema';

interface RemediationTableProps {
  findings: Finding[];
}

interface EditingRow {
  id: string;
  remediation_status?: string;
  due_date?: string;
  owner?: string;
  hasChanges: boolean;
}

export function RemediationTable({ findings }: RemediationTableProps) {
  const { dispatch } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditingRow | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (findings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <p className="text-slate-500 dark:text-slate-400">No remediation items to display</p>
      </div>
    );
  }

  const handleDoubleClick = (finding: Finding) => {
    setEditingId(finding.id);
    setEditValues({
      id: finding.id,
      remediation_status: finding.remediation_status,
      due_date: finding.due_date,
      owner: finding.owner,
      hasChanges: false,
    });
    setErrors({});
  };

  const validateDateFormat = (date: string): boolean => {
    if (!date) return true; // Allow empty
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  };

  const handleChange = (field: string, value: string) => {
    if (!editValues) return;
    const newErrors = { ...errors };

    if (field === 'due_date' && value && !validateDateFormat(value)) {
      newErrors[field] = 'Invalid date format (YYYY-MM-DD)';
    } else {
      delete newErrors[field];
    }

    setEditValues({
      ...editValues,
      [field]: value,
      hasChanges: true,
    });
    setErrors(newErrors);
  };

  const handleSave = (id: string) => {
    if (!editValues || Object.keys(errors).length > 0) {
      // Cancel on validation error
      setEditingId(null);
      setEditValues(null);
      return;
    }

    dispatch({
      type: 'UPDATE_REMEDIATION',
      payload: {
        id,
        status: editValues.remediation_status,
        due_date: editValues.due_date,
        owner: editValues.owner,
      },
    });

    setEditingId(null);
    setEditValues(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditValues(null);
    } else if (e.key === 'Enter') {
      handleSave(id);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            <th className="px-4 py-2 text-left">Finding</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Due Date</th>
            <th className="px-4 py-2 text-left">Owner</th>
          </tr>
        </thead>
        <tbody>
          {findings.map(finding => (
            <tr
              key={finding.id}
              onDoubleClick={() => handleDoubleClick(finding)}
              className={`border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                editingId === finding.id ? 'bg-blue-50 dark:bg-blue-900' : ''
              }`}
            >
              <td className="px-4 py-2">
                {finding.title}
                {editingId === finding.id && editValues?.hasChanges && ' *'}
              </td>
              <td className="px-4 py-2">
                {editingId === finding.id && editValues ? (
                  <select
                    value={editValues.remediation_status || ''}
                    onChange={(e) => handleChange('remediation_status', e.target.value)}
                    onBlur={() => handleSave(finding.id)}
                    onKeyDown={(e) => handleKeyDown(e, finding.id)}
                    className="px-2 py-1 border rounded dark:bg-slate-600"
                    autoFocus
                  >
                    <option value="">Select status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  finding.remediation_status || '-'
                )}
              </td>
              <td className="px-4 py-2">
                {editingId === finding.id && editValues ? (
                  <>
                    <input
                      type="date"
                      value={editValues.due_date || ''}
                      onChange={(e) => handleChange('due_date', e.target.value)}
                      onBlur={() => handleSave(finding.id)}
                      onKeyDown={(e) => handleKeyDown(e, finding.id)}
                      className="px-2 py-1 border rounded dark:bg-slate-600"
                    />
                    {errors.due_date && (
                      <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>
                    )}
                  </>
                ) : (
                  finding.due_date || '-'
                )}
              </td>
              <td className="px-4 py-2">
                {editingId === finding.id && editValues ? (
                  <input
                    type="email"
                    value={editValues.owner || ''}
                    onChange={(e) => handleChange('owner', e.target.value)}
                    onBlur={() => handleSave(finding.id)}
                    onKeyDown={(e) => handleKeyDown(e, finding.id)}
                    className="px-2 py-1 border rounded dark:bg-slate-600"
                    placeholder="email@example.com"
                  />
                ) : (
                  finding.owner || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
