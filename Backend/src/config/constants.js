export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_L2: 'ADMIN_L2',
  ADMIN_L3: 'ADMIN_L3',
  USER: 'USER',
};

export const PERMISSIONS = {
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
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_USER_PERMISSIONS = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.PROJECTS_VIEW,
  PERMISSIONS.TESTS_VIEW,
  PERMISSIONS.TESTS_RUN,
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.BUGS_VIEW,
  PERMISSIONS.BUGS_MANAGE,
  PERMISSIONS.SETTINGS_VIEW,
];

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  TESTING: 'testing',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const TEST_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const BUG_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const BUG_CATEGORY = {
  LAYOUT: 'layout',
  SPACING: 'spacing',
  TYPOGRAPHY: 'typography',
  COLOR: 'color',
  IMAGE: 'image',
  ALIGNMENT: 'alignment',
  COMPONENT_SIZE: 'component_size',
  VISIBILITY: 'visibility',
  RESPONSIVE: 'responsive',
  OTHER: 'other',
};

export const BUG_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  IGNORED: 'ignored',
  REGRESSED: 'regressed',
};

export const WEBSITE_TYPE = {
  UPLOADED_STATIC: 'uploaded_static',
  AI_GENERATED: 'ai_generated',
};

export const ALLOWED_COMPONENT_TYPES = [
  'navbar',
  'hero',
  'heading',
  'text',
  'button',
  'image',
  'card',
  'productGrid',
  'featureGrid',
  'stats',
  'pricing',
  'testimonial',
  'form',
  'newsletter',
  'footer',
  'spacer',
];
