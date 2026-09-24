import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { adminApi } from '../../api';
import {
  Users,
  FolderGit2,
  PlayCircle,
  Bug,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminOverviewPage = () => {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [overRes, analRes] = await Promise.all([
          adminApi.getOverview(),
          adminApi.getAnalytics(),
        ]);
        if (overRes.success) setOverview(overRes.data);
        if (analRes.success) setAnalytics(analRes.data);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const metrics = overview?.metrics || {};

  const bugChartData = (analytics?.bugsDistribution || []).map((b) => ({
    name: b._id,
    value: b.count,
  }));

  const COLORS = ['#ef4444', '#10b981', '#6b7280', '#8b5cf6'];

  return (
    <DashboardLayout
      title="Admin Intelligence & System Overview"
      subtitle="Global performance metrics, active users, test executions, and RBAC health"
    >
      <div className="space-y-8 text-left">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Users
            </span>
            <div className="text-2xl font-black text-white">{metrics.totalUsers ?? 0}</div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              {metrics.activeUsers ?? 0} Active
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Projects
            </span>
            <div className="text-2xl font-black text-white">{metrics.totalProjects ?? 0}</div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 block">Monitored</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Test Runs
            </span>
            <div className="text-2xl font-black text-white">{metrics.totalTestRuns ?? 0}</div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">
              {metrics.testsToday ?? 0} Today
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Open Visual Bugs
            </span>
            <div className="text-2xl font-black text-red-400">{metrics.totalOpenBugs ?? 0}</div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              {metrics.totalResolvedBugs ?? 0} Resolved
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Admin Accounts
            </span>
            <div className="text-2xl font-black text-purple-400">{metrics.totalAdmins ?? 1}</div>
            <span className="text-[10px] text-purple-300 font-semibold mt-1 block">RBAC Protected</span>
          </Card>
        </div>

        {/* Real Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bugs Status Breakdown */}
          <Card className="border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-400" />
              <span>Bugs Distribution (Real Database Data)</span>
            </h3>
            <div className="h-64 flex items-center justify-center">
              {bugChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bugChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {bugChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-gray-500">No bug records available yet.</div>
              )}
            </div>
          </Card>

          {/* Test Runs Activity */}
          <Card className="border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Test Runs Over Time</span>
            </h3>
            <div className="h-64 flex items-center justify-center">
              {analytics?.testRunsTrend && analytics.testRunsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.testRunsTrend}>
                    <XAxis dataKey="_id" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-gray-500">Activity will appear here as tests execute.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Platform Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-4">Recent Registered Users</h3>
            <div className="space-y-3">
              {(overview?.recentUsers || []).map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-gray-400 text-[11px]">{u.email}</span>
                  </div>
                  <Badge variant={u.role}>{u.role}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-4">Recent Projects</h3>
            <div className="space-y-3">
              {(overview?.recentProjects || []).map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{p.name}</span>
                    <span className="text-gray-400 text-[11px]">By: {p.createdBy?.name || 'User'}</span>
                  </div>
                  <Badge variant={p.status}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
