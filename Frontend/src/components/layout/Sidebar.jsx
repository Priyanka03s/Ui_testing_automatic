import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Layers,
  LayoutDashboard,
  FolderGit2,
  Users,
  ShieldAlert,
  BarChart3,
  FileClock,
  UserCheck,
  Settings,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
    }`;

  return (
    <aside className="w-64 border-r border-gray-800/80 bg-gray-950/70 backdrop-blur flex flex-col h-screen sticky top-0 select-none z-40">
      {/* Brand Header */}
      <div className="h-18 px-6 border-b border-gray-800/80 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>DesignCheck</span>
              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-black">AI</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Visual QA Engine</div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              <User className="w-4 h-4" />
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Navigation (Restricted to Admins possessing permissions) */}
        {isAdmin && (
          <div>
            <div className="text-[11px] font-semibold text-purple-400/90 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Administration</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded font-bold">RBAC</span>
            </div>
            <nav className="space-y-1">
              {hasPermission(APP_CONFIG.permissions.DASHBOARD_VIEW) && (
                <NavLink to="/admin" end className={navClass}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Admin Overview</span>
                </NavLink>
              )}
              {hasPermission(APP_CONFIG.permissions.USERS_VIEW) && (
                <NavLink to="/admin/users" className={navClass}>
                  <Users className="w-4 h-4" />
                  <span>User Management</span>
                </NavLink>
              )}
              {hasPermission(APP_CONFIG.permissions.ADMINS_MANAGE) && (
                <NavLink to="/admin/admins" className={navClass}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admins & Roles</span>
                </NavLink>
              )}
              {hasPermission(APP_CONFIG.permissions.AUDIT_LOGS_VIEW) && (
                <NavLink to="/admin/audit-logs" className={navClass}>
                  <FileClock className="w-4 h-4" />
                  <span>Audit Logs</span>
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-gray-800/80 bg-gray-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold text-xs text-white uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-semibold text-gray-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
