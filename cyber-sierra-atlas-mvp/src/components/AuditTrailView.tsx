import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Download, Trash2 } from 'lucide-react';
import { getAuditTrail, searchAuditLog, exportAuditLog, clearAuditLog, getAuditLogStats, AuditEntry } from '../lib/audit-log';

interface AuditTrailViewProps {
  maxDisplayRows?: number;
}

export function AuditTrailView({ maxDisplayRows = 50 }: AuditTrailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Get audit trail data
  const allEntries = getAuditTrail();
  const stats = getAuditLogStats();

  // Apply filters and search
  const filteredEntries = useMemo(() => {
    let results = allEntries;

    // Apply action filter
    if (filterAction) {
      results = results.filter(e => e.action === filterAction);
    }

    // Apply user filter
    if (filterUser) {
      results = results.filter(e => e.user.toLowerCase().includes(filterUser.toLowerCase()));
    }

    // Apply date range filter
    if (dateRange.start) {
      const startTime = new Date(dateRange.start).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= startTime);
    }

    if (dateRange.end) {
      const endTime = new Date(dateRange.end).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= endTime);
    }

    // Apply text search to all fields
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        (e.findingId && e.findingId.toLowerCase().includes(q)) ||
        (e.findingIds && e.findingIds.some(id => id.toLowerCase().includes(q))) ||
        (e.assetId && e.assetId.toLowerCase().includes(q)) ||
        (e.reason && e.reason.toLowerCase().includes(q))
      );
    }

    return results.slice(0, maxDisplayRows);
  }, [allEntries, filterAction, filterUser, dateRange, searchQuery, maxDisplayRows]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    const jsonData = exportAuditLog();
    if (!jsonData) {
      alert('Failed to export audit log');
      return;
    }

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    if (clearAuditLog(true)) {
      setShowClearConfirm(false);
      // Trigger re-render by reloading component state
      window.location.reload();
    } else {
      alert('Failed to clear audit log');
    }
  };

  const getUniqueActions = (): string[] => {
    return Object.keys(stats.actionCounts).sort();
  };

  const getUniqueUsers = (): string[] => {
    return Object.keys(stats.userCounts).sort();
  };

  const formatTimestamp = (ts: string): string => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const renderChanges = (changes?: Record<string, { before: unknown; after: unknown }>): JSX.Element | null => {
    if (!changes || Object.keys(changes).length === 0) return null;

    return (
      <div className="mt-3 space-y-2 border-l-2 border-blue-300 pl-3">
        <p className="text-sm font-semibold text-gray-700">Changes:</p>
        {Object.entries(changes).map(([field, { before, after }]) => (
          <div key={field} className="text-sm">
            <span className="font-medium">{field}:</span>
            <div className="flex gap-3 ml-2 mt-1">
              <div>
                <span className="text-red-600">Before:</span>
                <code className="ml-1 bg-red-50 px-2 py-1 rounded text-xs">
                  {JSON.stringify(before)}
                </code>
              </div>
              <div>
                <span className="text-green-600">After:</span>
                <code className="ml-1 bg-green-50 px-2 py-1 rounded text-xs">
                  {JSON.stringify(after)}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
            <p className="text-sm text-gray-600 mt-1">
              Immutable record of all system changes: {stats.totalEntries} entries
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Log
            </button>
          </div>
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Clear Audit Log?</h3>
              <p className="text-gray-600 mb-4">
                This action is permanent and cannot be undone. All {stats.totalEntries} audit entries will be deleted.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLog}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, user, finding ID, or asset ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              {getUniqueActions().map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {getUniqueUsers().map(user => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {allEntries.length === 0 ? 'No audit entries yet' : 'No entries match your filters'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Finding/Asset</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => (
                <React.Fragment key={entry.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entry.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.findingId ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{entry.findingId}</code>
                      ) : entry.findingIds && entry.findingIds.length > 0 ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {entry.findingIds.length} findings
                        </code>
                      ) : entry.assetId ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{entry.assetId}</code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {(entry.changes || entry.reason || entry.metadata) && (
                        <button
                          onClick={() => toggleRow(entry.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedRows.has(entry.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedRows.has(entry.id) && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-3">
                          {entry.reason && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Reason:</p>
                              <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>
                            </div>
                          )}

                          {entry.findingIds && entry.findingIds.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Finding IDs:</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {entry.findingIds.map(id => (
                                  <code
                                    key={id}
                                    className="bg-gray-200 px-2 py-1 rounded text-xs font-mono"
                                  >
                                    {id}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}

                          {renderChanges(entry.changes)}

                          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Metadata:</p>
                              <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded mt-1 overflow-x-auto max-h-48">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-300">
                            ID: {entry.id}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats */}
      {stats.totalEntries > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
            </div>
            <div>
              <p className="text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.userCounts).length}</p>
            </div>
            <div>
              <p className="text-gray-600">Action Types</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.actionCounts).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
