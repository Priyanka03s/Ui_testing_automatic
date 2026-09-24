import { Router } from 'express';
import {
  getOverview,
  getAnalytics,
  getUsers,
  getUserDetail,
  updateUserStatus,
  getAdmins,
  createAdmin,
  updateAdminPermissions,
  getAuditLogs,
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createAdminSchema, updateAdminPermissionsSchema } from '../validators/adminValidators.js';
import { PERMISSIONS } from '../config/constants.js';

const router = Router();

router.get('/overview', requireAuth, requirePermission(PERMISSIONS.DASHBOARD_VIEW), getOverview);
router.get('/analytics', requireAuth, requirePermission(PERMISSIONS.ANALYTICS_VIEW), getAnalytics);
router.get('/users', requireAuth, requirePermission(PERMISSIONS.USERS_VIEW), getUsers);
router.get('/users/:id', requireAuth, requirePermission(PERMISSIONS.USERS_VIEW), getUserDetail);
router.patch('/users/:id/status', requireAuth, requirePermission(PERMISSIONS.USERS_MANAGE), updateUserStatus);
router.get('/admins', requireAuth, requirePermission(PERMISSIONS.ADMINS_MANAGE), getAdmins);
router.post('/admins', requireAuth, validate(createAdminSchema), createAdmin);
router.patch('/admins/:id/permissions', requireAuth, validate(updateAdminPermissionsSchema), updateAdminPermissions);
router.get('/audit-logs', requireAuth, requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW), getAuditLogs);

export default router;
