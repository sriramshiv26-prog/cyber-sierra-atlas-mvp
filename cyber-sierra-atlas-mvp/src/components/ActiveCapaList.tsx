import React, { useState, useMemo } from 'react';
import { CapaWorkflow, CapaStatus } from '../types/capa';

interface ActiveCapaListProps {
  capas: CapaWorkflow[];
  onSelectCapa: (capa: CapaWorkflow) => void;
}

export const ActiveCapaList: React.FC<ActiveCapaListProps> = ({ capas, onSelectCapa }) => {
  const [statusFilter, setStatusFilter] = useState<CapaStatus | ''>('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCapas = useMemo(() => {
    return capas.filter(capa => {
      const matchesStatus = !statusFilter || capa.status === statusFilter;
      const matchesOwner = !ownerFilter || capa.action_plan.owner.includes(ownerFilter);
      const matchesSearch = !searchTerm ||
        capa.finding_id.includes(searchTerm) ||
        capa.rca.problem_statement.includes(searchTerm);
      return matchesStatus && matchesOwner && matchesSearch;
    });
  }, [capas, statusFilter, ownerFilter, searchTerm]);

  const getStatusColor = (status: CapaStatus) => {
    const colors: Record<CapaStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      rca_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      rca_completed: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      plan_approved: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      implementing: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
      verification_pending: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
      closed: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    };
    return colors[status];
  };

  const getDaysUntilDue = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search finding ID or problem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CapaStatus | '')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          >
            <option value="">Filter by status</option>
            <option value="draft">Draft</option>
            <option value="rca_pending">RCA Pending</option>
            <option value="rca_completed">RCA Completed</option>
            <option value="plan_approved">Plan Approved</option>
            <option value="implementing">Implementing</option>
            <option value="verification_pending">Verification Pending</option>
            <option value="closed">Closed</option>
          </select>
          <input
            type="text"
            placeholder="Filter by owner..."
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-slate-800 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Finding ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Root Cause</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Owner</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Action Due</th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {filteredCapas.map((capa) => (
              <tr
                key={capa.id}
                onClick={() => onSelectCapa(capa)}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.finding_id}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(capa.status)}`}>
                    {capa.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300 max-w-xs truncate">
                  {capa.rca.root_causes[0]?.description || capa.rca.problem_statement}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.action_plan.owner}</td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">{capa.action_plan.target_date}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className={getDaysUntilDue(capa.action_plan.target_date) < 0 ? 'text-red-600' : 'dark:text-gray-300'}>
                    {getDaysUntilDue(capa.action_plan.target_date)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCapas.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No active CAPA workflows found
        </div>
      )}
    </div>
  );
};
