import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { adminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Users,
  Search,
  Eye,
  UserX,
  UserCheck,
  Calendar,
  Layers,
  PlayCircle,
  Bug,
  Shield,
} from 'lucide-react';

export const AdminUsersPage = () => {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // User Detail Drawer / Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const canManageUsers = isSuperAdmin || hasPermission(APP_CONFIG.permissions.USERS_MANAGE);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setUsers(res.data.users || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const actionName = user.isActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${actionName} ${user.name}'s account?`)) return;

    try {
      await adminApi.updateUserStatus(user._id, !user.isActive);
      await fetchUsers();
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser((prev) => ({ ...prev, isActive: !user.isActive }));
      }
    } catch (err) {
      alert(err.message || `Failed to ${actionName} user`);
    }
  };

  const handleOpenDetail = async (user) => {
    setSelectedUser(user);
    setIsDetailLoading(true);
    try {
      const res = await adminApi.getUserDetail(user._id);
      if (res.success && res.data) {
        setUserDetailData(res.data);
      }
    } catch (err) {
      console.error('Failed to load user detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <DashboardLayout title="User Management" subtitle="Inspect user accounts, permissions, and test activity">
      <div className="space-y-6 text-left">
        {/* Filters Bar */}
        <Card className="border border-gray-800 p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="USER">Normal User</option>
                <option value="ADMIN_L2">Admin L2</option>
                <option value="ADMIN_L3">Admin L3</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Apply Search
              </Button>
            </div>
          </form>
        </Card>

        {/* User Table */}
        <Card className="border border-gray-800 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Auth Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Projects</th>
                  <th className="py-3.5 px-4">Test Runs</th>
                  <th className="py-3.5 px-4">Open Bugs</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 capitalize font-mono">{u.authProvider}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.isActive ? 'passed' : 'failed'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-semibold">{u.projectsCount || 0}</td>
                    <td className="py-3.5 px-4 text-gray-300 font-semibold">{u.testRunsCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span className={u.openBugsCount > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                        {u.openBugsCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetail(u)}
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Button>

                        {canManageUsers && u.role !== 'SUPER_ADMIN' && (
                          <Button
                            variant={u.isActive ? 'danger' : 'success'}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            <span>{u.isActive ? 'Deactivate' : 'Reactivate'}</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
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

        {/* User Detail Drawer / Modal */}
        <Modal
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setUserDetailData(null);
          }}
          title={selectedUser ? `User Details: ${selectedUser.name}` : 'User Details'}
          maxWidth="max-w-2xl"
        >
          {isDetailLoading ? (
            <div className="p-8 text-center text-gray-400">Loading user profile and history...</div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Profile Card Header */}
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-white">{selectedUser?.name}</div>
                  <div className="text-xs text-gray-400">{selectedUser?.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedUser?.role}>{selectedUser?.role}</Badge>
                    <Badge variant={selectedUser?.isActive ? 'passed' : 'failed'}>
                      {selectedUser?.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Auth: <span className="font-mono text-white">{selectedUser?.authProvider}</span></div>
                  <div>Joined: {new Date(selectedUser?.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* User Projects List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  User Projects ({userDetailData?.projects?.length || 0})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(userDetailData?.projects || []).map((p) => (
                    <div
                      key={p._id}
                      className="p-3 rounded-lg bg-gray-900/40 border border-gray-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{p.name}</span>
                      <Badge variant={p.status}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Audit Action History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Recent Activity Logs
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {(userDetailData?.auditLogs || []).map((log) => (
                    <div
                      key={log._id}
                      className="p-2 rounded bg-gray-950/60 border border-gray-800 text-gray-300 flex items-center justify-between"
                    >
                      <span className="text-blue-400 font-semibold">{log.action}</span>
                      <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
