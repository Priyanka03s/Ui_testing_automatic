import { ROLES } from '../config/constants.js';
import { sendError } from '../utils/apiResponse.js';

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    // Super Admin has all permissions unconditionally
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user has explicit permission assigned
    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permission)) {
      return sendError(
        res,
        `Forbidden: Missing required permission [${permission}]`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};
