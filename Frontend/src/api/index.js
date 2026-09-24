import { apiClient } from './client';

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  googleAuth: (credential) => apiClient.post('/auth/google', { credential }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const userApi = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.patch('/users/profile', data),
};

export const projectApi = {
  getProjects: () => apiClient.get('/projects'),
  getProjectById: (id) => apiClient.get(`/projects/${id}`),
  createProject: (data) => apiClient.post('/projects', data),
  updateProject: (id, data) => apiClient.patch(`/projects/${id}`, data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),
};

export const figmaApi = {
  connect: (projectId, data) => apiClient.post(`/projects/${projectId}/figma/connect`, data),
  getConnection: (projectId) => apiClient.get(`/projects/${projectId}/figma`),
  importFrames: (projectId) => apiClient.post(`/projects/${projectId}/figma/import`),
};

export const websiteApi = {
  uploadStatic: (projectId, formData) =>
    apiClient.post(`/projects/${projectId}/websites/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  generateAi: (projectId, prompt) =>
    apiClient.post(`/projects/${projectId}/websites/generate`, { prompt }),
  getWebsite: (projectId) => apiClient.get(`/projects/${projectId}/websites`),
};

export const mappingApi = {
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/page-mappings`, data),
  getByProject: (projectId) => apiClient.get(`/projects/${projectId}/page-mappings`),
  update: (id, data) => apiClient.patch(`/page-mappings/${id}`, data),
  delete: (id) => apiClient.delete(`/page-mappings/${id}`),
};

export const testRunApi = {
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/test-runs`, data),
  getByProject: (projectId) => apiClient.get(`/projects/${projectId}/test-runs`),
  getById: (id) => apiClient.get(`/test-runs/${id}`),
  retry: (id) => apiClient.post(`/test-runs/${id}/retry`),
  cancel: (id) => apiClient.post(`/test-runs/${id}/cancel`),
};

export const bugApi = {
  getByProject: (projectId, params) => apiClient.get(`/projects/${projectId}/bugs`, { params }),
  getById: (id) => apiClient.get(`/bugs/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/bugs/${id}/status`, { status }),
};

export const adminApi = {
  getOverview: () => apiClient.get('/admin/overview'),
  getAnalytics: () => apiClient.get('/admin/analytics'),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserDetail: (id) => apiClient.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => apiClient.patch(`/admin/users/${id}/status`, { isActive }),
  getAdmins: () => apiClient.get('/admin/admins'),
  createAdmin: (data) => apiClient.post('/admin/admins', data),
  updatePermissions: (id, permissions) =>
    apiClient.patch(`/admin/admins/${id}/permissions`, { permissions }),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
};
