export const APP_CONFIG = {
  appName: 'DesignCheck AI',
  tagline: 'Automatically validate your website against your Figma design.',
  
  // Applicant details configurable here
  candidate: {
    name: import.meta.env.VITE_CANDIDATE_NAME || 'Priyanka Samiappan',
    githubUrl: import.meta.env.VITE_GITHUB_URL || 'https://github.com/PriyankaSamiappan',
    linkedinUrl: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/in/priyanka-samiappan/',
  },

  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  previewBaseUrl: import.meta.env.VITE_PREVIEW_URL || 'http://localhost:5000/preview',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  permissions: {
    DASHBOARD_VIEW: 'dashboard.view',
    USERS_VIEW: 'users.view',
    USERS_MANAGE: 'users.manage',
    PROJECTS_VIEW: 'projects.view',
    PROJECTS_VIEW_ALL: 'projects.view_all',
    TESTS_VIEW: 'tests.view',
    TESTS_VIEW_ALL: 'tests.view_all',
    TESTS_RUN: 'tests.run',
    REPORTS_VIEW: 'reports.view',
    REPORTS_VIEW_ALL: 'reports.view_all',
    BUGS_VIEW: 'bugs.view',
    BUGS_MANAGE: 'bugs.manage',
    ANALYTICS_VIEW: 'analytics.view',
    AUDIT_LOGS_VIEW: 'audit_logs.view',
    ADMINS_CREATE_L2: 'admins.create_l2',
    ADMINS_CREATE_L3: 'admins.create_l3',
    ADMINS_MANAGE: 'admins.manage',
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_MANAGE: 'settings.manage',
  },

  roles: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN_L2: 'ADMIN_L2',
    ADMIN_L3: 'ADMIN_L3',
    USER: 'USER',
  },
};
