import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api';
import { User, Shield, CheckCircle2, Save } from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [stats, setStats] = useState({ projectsCount: 0, testsCount: 0, openBugsCount: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);

    const loadStats = async () => {
      try {
        const res = await userApi.getProfile();
        if (res.success && res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    };
    loadStats();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await userApi.updateProfile({ name });
      if (res.success) {
        setMessage('Profile updated successfully');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Account Profile" subtitle="Manage your profile information and active credentials">
      <div className="max-w-3xl space-y-6 text-left">
        {message && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* User Card */}
        <Card className="border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white uppercase shadow-lg shadow-blue-500/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user?.role}>{user?.role?.replace('_', ' ')}</Badge>
                  <span className="text-[11px] text-gray-500 uppercase font-mono">
                    Provider: {user?.authProvider}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-xs text-gray-400 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
              <div>
                <span className="text-gray-500 block">Projects</span>
                <span className="text-sm font-bold text-white">{stats.projectsCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Tests</span>
                <span className="text-sm font-bold text-white">{stats.testsCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Open Bugs</span>
                <span className="text-sm font-bold text-red-400">{stats.openBugsCount}</span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed directly for security and audit integrity"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Assigned Permissions Read-Only List */}
        <Card className="border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Assigned System Permissions</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {(user?.permissions || []).map((perm) => (
              <span
                key={perm}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-gray-900 border border-gray-800 text-gray-300"
              >
                {perm}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
