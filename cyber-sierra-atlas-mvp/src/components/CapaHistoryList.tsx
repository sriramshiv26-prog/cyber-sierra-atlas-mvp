import React, { useState, useMemo } from 'react';
import { CapaWorkflow } from '../types/capa';

interface CapaHistoryListProps {
  closedCapas: CapaWorkflow[];
  onSelectCapa: (capa: CapaWorkflow) => void;
}

export const CapaHistoryList: React.FC<CapaHistoryListProps> = ({
  closedCapas,
  onSelectCapa,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredCapas = useMemo(() => {
    return closedCapas.filter((capa) => {
      const matchesSearch =
        !searchTerm ||
        capa.finding_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        capa.rca.problem_statement
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesDate =
        !dateFilter || capa.updated_at.startsWith(dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [closedCapas, searchTerm, dateFilter]);

  const calculateDaysToClose = (created: string, updated: string): number => {
    const createdDate = new Date(created).getTime();
    const updatedDate = new Date(updated).getTime();
    return Math.ceil((updatedDate - createdDate) / (1000 * 60 * 60 * 24));
  };

  const getRootCauseText = (capa: CapaWorkflow): string => {
    if (capa.rca.root_causes.length > 0) {
      return capa.rca.root_causes[0].description;
    }
    return 'Not specified';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Search finding ID or problem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-slate-800 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                Finding ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                Root Cause
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                Closed Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                Days to Close
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCapas.map((capa) => (
              <tr
                key={capa.id}
                onClick={() => onSelectCapa(capa)}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm dark:text-gray-300 font-medium">
                  {capa.finding_id}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300 max-w-xs truncate">
                  {getRootCauseText(capa)}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">
                  {formatDate(capa.updated_at)}
                </td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">
                  {calculateDaysToClose(capa.created_at, capa.updated_at)} days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredCapas.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No closed CAPA records found
        </div>
      )}
    </div>
  );
};
