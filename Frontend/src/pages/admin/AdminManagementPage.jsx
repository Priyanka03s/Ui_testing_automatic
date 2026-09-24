import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { adminApi } from '../../api';
import { APP_CONFIG } from '../../config/appConfig';
import { useAuth } from '../../context/AuthContext';
import { Shield, ShieldAlert, Plus, Edit2, CheckSquare, Square } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    category: 'Dashboard & Analytics',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard' },
      { key: 'analytics.view', label: 'View Global Analytics' },
      { key: 'audit_logs.view', label: 'View Audit Logs' },
    ],
  },
  {
    category: 'User Management',
    permissions: [
      { key: 'users.view', label: 'View Users List' },
      { key: 'users.manage', label: 'Manage & Deactivate Users' },
    ],
  },
  {
    category: 'Projects & Testing',
    permissions: [
      { key: 'projects.view', label: 'View Assigned Projects' },
      { key: 'projects.view_all', label: 'View All Projects Globally' },
      { key: 'tests.view', label: 'View Test Results' },
      { key: 'tests.view_all', label: 'View All Tests Globally' },
      { key: 'tests.run', label: 'Trigger Test Executions' },
      { key: 'bugs.view', label: 'View Bug Reports' },
      { key: 'bugs.manage', label: 'Resolve & Ignore Bugs' },
    ],
  },
  {
    category: 'Admin Governance',
    permissions: [
      { key: 'admins.create_l2', label: 'Create ADMIN_L2 Accounts' },
      { key: 'admins.create_l3', label: 'Create ADMIN_L3 Accounts' },
      { key: 'admins.manage', label: 'Manage Admin Accounts' },
      { key: 'settings.view', label: 'View System Settings' },
      { key: 'settings.manage', label: 'Modify System Settings' },
    ],
  },
];

export const AdminManagementPage = () => {
  const { isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Admin Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: APP_CONFIG.roles.ADMIN_L2,
    permissions: ['dashboard.view', 'projects.view', 'tests.view'],
  });

  // Edit Permissions Modal State
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAdmins();
      if (res.success && res.data) {
        setAdmins(res.data.admins || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleNewPermission = (key) => {
    setNewAdmin((prev) => {
      const exists = prev.permissions.includes(key);
      const updated = exists
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: updated };
    });
  };

  const handleToggleEditPermission = (key) => {
    setEditPermissions((prev) => {
      return prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key];
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminApi.createAdmin(newAdmin);
      if (res.success) {
        setSuccessMsg(`Administrator ${newAdmin.name} created successfully.`);
        setIsCreateOpen(false);
        setNewAdmin({
          name: '',
          email: '',
          password: '',
          role: APP_CONFIG.roles.ADMIN_L2,
          permissions: ['dashboard.view', 'projects.view', 'tests.view'],
        });
        await fetchAdmins();
      }
    } catch (err) {
      setError(err.message || 'Failed to create administrator');
    }
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    try {
      const res = await adminApi.updatePermissions(editingAdmin._id, editPermissions);
      if (res.success) {
        setSuccessMsg(`Permissions updated for ${editingAdmin.name}.`);
        setEditingAdmin(null);
        await fetchAdmins();
      }
    } catch (err) {
      setError(err.message || 'Failed to update permissions');
    }
  };

  return (
    <DashboardLayout
      title="Admin & Role Governance"
      subtitle="Manage L2/L3 administrators and assign granular permission sets"
      action={
        isSuperAdmin && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Create Admin</span>
          </Button>
        )
      }
    >
      <div className="space-y-6 text-left">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {successMsg}
          </div>
        )}

        {/* Admin List Cards */}
        <div className="grid grid-cols-1 gap-4">
          {admins.map((admin) => (
            <Card key={admin._id} className="border border-gray-800 p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{admin.name}</span>
                      <Badge variant={admin.role}>{admin.role}</Badge>
                      <Badge variant={admin.isActive ? 'passed' : 'failed'}>
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{admin.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {isSuperAdmin && admin.role !== 'SUPER_ADMIN' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAdmin(admin);
                        setEditPermissions(admin.permissions || []);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Permissions</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions list */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Active Permissions ({admin.permissions?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(admin.permissions || []).map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-900 border border-gray-800 text-purple-300"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal: Create Admin */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Administrator Account"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="jane@company.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Admin Level
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={APP_CONFIG.roles.ADMIN_L2}>ADMIN_L2 (Senior QA)</option>
                  <option value={APP_CONFIG.roles.ADMIN_L3}>ADMIN_L3 (Junior QA)</option>
                </select>
              </div>
            </div>

            {/* Granular Permission Checkboxes Grid */}
            <div className="space-y-4 pt-2 border-t border-gray-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-400">
                Granular Permissions Assignment
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-2 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                    <div className="text-[11px] font-bold text-gray-400 uppercase">
                      {group.category}
                    </div>
                    {group.permissions.map((perm) => {
                      const isChecked = newAdmin.permissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handleToggleNewPermission(perm.key)}
                          className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-600" />
                          )}
                          <span>{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Admin
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Permissions */}
        <Modal
          isOpen={!!editingAdmin}
          onClose={() => setEditingAdmin(null)}
          title={`Edit Permissions: ${editingAdmin?.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-left">
            <p className="text-xs text-gray-400">
              Select or deselect features this administrator is authorized to access:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.category} className="space-y-2 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                  <div className="text-[11px] font-bold text-gray-400 uppercase">
                    {group.category}
                  </div>
                  {group.permissions.map((perm) => {
                    const isChecked = editPermissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleToggleEditPermission(perm.key)}
                        className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-600" />
                        )}
                        <span>{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setEditingAdmin(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
