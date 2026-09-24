import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { adminApi } from '../../api';
import { FileClock, Search, Shield, Globe } from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [actionSearch, setActionSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        action: actionSearch || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  return (
    <DashboardLayout
      title="Security & System Audit Logs"
      subtitle="Complete chronological audit trail of administrative and security events"
    >
      <div className="space-y-6 text-left">
        {/* Search */}
        <Card className="border border-gray-800 p-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by action (e.g. admin.create_l2)..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>
        </Card>

        {/* Logs Table */}
        <Card className="border border-gray-800 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">Metadata</th>
                  <th className="py-3.5 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-900/40 transition">
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-sans font-semibold">
                        {log.actorUserId?.name || 'System / Guest'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-sans">
                        {log.actorUserId?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-400">{log.action}</td>
                    <td className="py-3 px-4 text-gray-300 font-sans">
                      {log.resourceType}{' '}
                      {log.resourceId && (
                        <span className="text-gray-500 text-[11px]">({log.resourceId.slice(-6)})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[11px] max-w-xs truncate font-sans">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
