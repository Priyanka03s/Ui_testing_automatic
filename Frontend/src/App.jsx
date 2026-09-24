import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsListPage } from './pages/projects/ProjectsListPage';
import { NewProjectPage } from './pages/projects/NewProjectPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ProfilePage } from './pages/profile/ProfilePage';

import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminManagementPage } from './pages/admin/AdminManagementPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { APP_CONFIG } from './config/appConfig';

export function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated User Workspace */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <NewProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Governance Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly requiredPermission={APP_CONFIG.permissions.DASHBOARD_VIEW}>
            <AdminOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly requiredPermission={APP_CONFIG.permissions.USERS_VIEW}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <ProtectedRoute adminOnly requiredPermission={APP_CONFIG.permissions.ADMINS_MANAGE}>
            <AdminManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute adminOnly requiredPermission={APP_CONFIG.permissions.AUDIT_LOGS_VIEW}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        }
      />

      {/* Default Navigation */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
