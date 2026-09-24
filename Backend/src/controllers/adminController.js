import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { TestRun } from '../models/TestRun.js';
import { Bug } from '../models/Bug.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, ALL_PERMISSIONS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const getOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTestRuns,
      totalOpenBugs,
      totalResolvedBugs,
      totalAdmins,
      testsToday,
      testsThisWeek,
      recentUsers,
      recentProjects,
      recentTestRuns,
      recentBugs,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.USER }),
      User.countDocuments({ isActive: true }),
      Project.countDocuments({ isDeleted: false }),
      TestRun.countDocuments(),
      Bug.countDocuments({ status: 'open' }),
      Bug.countDocuments({ status: 'resolved' }),
      User.countDocuments({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN_L2, ROLES.ADMIN_L3] } }),
      TestRun.countDocuments({ createdAt: { $gte: today } }),
      TestRun.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role isActive createdAt lastLoginAt'),
      Project.find({ isDeleted: false }).populate('createdBy', 'name email').sort({ createdAt: -1 }).limit(5),
      TestRun.find().populate('projectId', 'name').sort({ createdAt: -1 }).limit(5),
      Bug.find().populate('projectId', 'name').sort({ createdAt: -1 }).limit(5),
    ]);

    return sendSuccess(res, {
      metrics: {
        totalUsers,
        activeUsers,
        totalProjects,
        totalTestRuns,
        totalOpenBugs,
        totalResolvedBugs,
        totalAdmins,
        testsToday,
        testsThisWeek,
      },
      recentUsers,
      recentProjects,
      recentTestRuns,
      recentBugs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    // 7-day trend aggregations
    const days = 7;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const [usersTrend, projectsTrend, testRunsTrend, bugsDistribution, scoreDistribution] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: dateLimit } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Project.aggregate([
        { $match: { createdAt: { $gte: dateLimit }, isDeleted: false } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TestRun.aggregate([
        { $match: { createdAt: { $gte: dateLimit } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Bug.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      TestRun.aggregate([
        { $match: { status: 'completed' } },
        {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [0, 50, 75, 90, 101],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    return sendSuccess(res, {
      usersTrend,
      projectsTrend,
      testRunsTrend,
      bugsDistribution,
      scoreDistribution,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const search = req.query.search?.trim();
    const role = req.query.role;
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }
    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Populate user counts
    const userIds = users.map((u) => u._id);
    const [projectCounts, testCounts, bugCounts] = await Promise.all([
      Project.aggregate([
        { $match: { createdBy: { $in: userIds }, isDeleted: false } },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      ]),
      TestRun.aggregate([
        { $match: { startedBy: { $in: userIds } } },
        { $group: { _id: '$startedBy', count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        { $match: { 'project.createdBy': { $in: userIds }, status: 'open' } },
        { $group: { _id: '$project.createdBy', count: { $sum: 1 } } },
      ]),
    ]);

    const projectMap = Object.fromEntries(projectCounts.map((p) => [p._id.toString(), p.count]));
    const testMap = Object.fromEntries(testCounts.map((t) => [t._id.toString(), t.count]));
    const bugMap = Object.fromEntries(bugCounts.map((b) => [b._id.toString(), b.count]));

    const enrichedUsers = users.map((u) => ({
      ...u.toJSON(),
      projectsCount: projectMap[u._id.toString()] || 0,
      testRunsCount: testMap[u._id.toString()] || 0,
      openBugsCount: bugMap[u._id.toString()] || 0,
    }));

    return sendSuccess(res, {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    const [projects, testRuns, openBugs, auditLogs] = await Promise.all([
      Project.find({ createdBy: user._id, isDeleted: false }).sort({ createdAt: -1 }).limit(10),
      TestRun.find({ startedBy: user._id }).populate('projectId', 'name').sort({ createdAt: -1 }).limit(10),
      Bug.find({
        status: 'open',
        projectId: { $in: await Project.find({ createdBy: user._id, isDeleted: false }).distinct('_id') },
      }).sort({ createdAt: -1 }).limit(10),
      AuditLog.find({ actorUserId: user._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    return sendSuccess(res, {
      user: user.toJSON(),
      projects,
      testRuns,
      openBugs,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    if (targetUser.role === ROLES.SUPER_ADMIN) {
      return sendError(res, 'Super Admin account status cannot be altered', 403, 'SUPER_ADMIN_IMMUTABLE');
    }

    targetUser.isActive = Boolean(isActive);
    await targetUser.save();

    await logAudit({
      actorUserId: req.user._id,
      action: isActive ? 'admin.user_reactivated' : 'admin.user_deactivated',
      resourceType: 'User',
      resourceId: targetUser._id.toString(),
      metadata: { targetEmail: targetUser.email, newStatus: isActive },
      req,
    });

    return sendSuccess(res, { user: targetUser.toJSON() }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN_L2, ROLES.ADMIN_L3] },
    }).sort({ role: 1, createdAt: -1 });

    return sendSuccess(res, { admins: admins.map((a) => a.toJSON()) });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    if (![ROLES.ADMIN_L2, ROLES.ADMIN_L3].includes(role)) {
      return sendError(res, 'Only ADMIN_L2 or ADMIN_L3 accounts can be created', 400, 'INVALID_ADMIN_ROLE');
    }

    // Role creation permission verification
    if (role === ROLES.ADMIN_L2 && req.user.role !== ROLES.SUPER_ADMIN && !req.user.permissions?.includes('admins.create_l2')) {
      return sendError(res, 'Forbidden: Missing admins.create_l2 permission', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    if (role === ROLES.ADMIN_L3 && req.user.role !== ROLES.SUPER_ADMIN && !req.user.permissions?.includes('admins.create_l3')) {
      return sendError(res, 'Forbidden: Missing admins.create_l3 permission', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'Account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Filter assigned permissions to only valid ones
    const sanitizedPermissions = (permissions || []).filter((p) => ALL_PERMISSIONS.includes(p));

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name,
      email,
      passwordHash,
      role,
      permissions: sanitizedPermissions,
      authProvider: 'local',
      isActive: true,
      lastLoginAt: null,
    });

    await logAudit({
      actorUserId: req.user._id,
      action: `admin.create_${role.toLowerCase()}`,
      resourceType: 'User',
      resourceId: newAdmin._id.toString(),
      metadata: { targetEmail: newAdmin.email, role, permissions: sanitizedPermissions },
      req,
    });

    return sendSuccess(res, { admin: newAdmin.toJSON() }, `Administrator ${role} created successfully`, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const targetAdmin = await User.findById(req.params.id);

    if (!targetAdmin) {
      return sendError(res, 'Admin not found', 404, 'ADMIN_NOT_FOUND');
    }

    if (targetAdmin.role === ROLES.SUPER_ADMIN) {
      return sendError(res, 'Super Admin permissions cannot be modified', 403, 'SUPER_ADMIN_IMMUTABLE');
    }

    if (![ROLES.ADMIN_L2, ROLES.ADMIN_L3].includes(targetAdmin.role)) {
      return sendError(res, 'Target user is not an administrator', 400, 'NOT_AN_ADMIN');
    }

    // Verify caller has admins.manage permission or is Super Admin
    if (req.user.role !== ROLES.SUPER_ADMIN && !req.user.permissions?.includes('admins.manage')) {
      return sendError(res, 'Missing admins.manage permission', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const sanitizedPermissions = (permissions || []).filter((p) => ALL_PERMISSIONS.includes(p));
    targetAdmin.permissions = sanitizedPermissions;
    await targetAdmin.save();

    await logAudit({
      actorUserId: req.user._id,
      action: 'admin.update_permissions',
      resourceType: 'User',
      resourceId: targetAdmin._id.toString(),
      metadata: { targetEmail: targetAdmin.email, permissionsCount: sanitizedPermissions.length },
      req,
    });

    return sendSuccess(res, { admin: targetAdmin.toJSON() }, 'Permissions updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const action = req.query.action;

    const query = {};
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendSuccess(res, {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
