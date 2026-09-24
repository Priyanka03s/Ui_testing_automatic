import { Project } from '../models/Project.js';
import { PageMapping } from '../models/PageMapping.js';
import { TestRun } from '../models/TestRun.js';
import { Bug } from '../models/Bug.js';
import { FigmaConnection } from '../models/FigmaConnection.js';
import { Website } from '../models/Website.js';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      status: 'draft',
    });

    await logAudit({
      actorUserId: req.user._id,
      action: 'project.create',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      metadata: { name: project.name },
      req,
    });

    return sendSuccess(res, { project }, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const canViewAll = isSuperAdmin || req.user.permissions?.includes(PERMISSIONS.PROJECTS_VIEW_ALL);

    const query = { isDeleted: false };
    if (!canViewAll) {
      query.createdBy = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Enrich with metrics
    const projectIds = projects.map((p) => p._id);

    const [mappingsCount, testRuns, bugsCount, figmaConns, websites] = await Promise.all([
      PageMapping.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
      TestRun.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .select('projectId overallScore status createdAt'),
      Bug.aggregate([
        { $match: { projectId: { $in: projectIds }, status: 'open' } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]),
      FigmaConnection.find({ projectId: { $in: projectIds } }).select('projectId fileName connectedAt'),
      Website.find({ projectId: { $in: projectIds } }).select('projectId previewUrl type'),
    ]);

    const mappingsMap = Object.fromEntries(mappingsCount.map((m) => [m._id.toString(), m.count]));
    const bugsMap = Object.fromEntries(bugsCount.map((b) => [b._id.toString(), b.count]));
    const figmaMap = Object.fromEntries(figmaConns.map((f) => [f.projectId.toString(), f]));
    const websiteMap = Object.fromEntries(websites.map((w) => [w.projectId.toString(), w]));

    const latestTestMap = {};
    for (const test of testRuns) {
      const pid = test.projectId.toString();
      if (!latestTestMap[pid]) {
        latestTestMap[pid] = test;
      }
    }

    const enriched = projects.map((p) => {
      const pid = p._id.toString();
      return {
        ...p.toObject(),
        mappingsCount: mappingsMap[pid] || 0,
        openBugsCount: bugsMap[pid] || 0,
        latestTest: latestTestMap[pid] || null,
        figmaConnected: !!figmaMap[pid],
        websiteConnected: !!websiteMap[pid],
      };
    });

    return sendSuccess(res, { projects: enriched });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false }).populate(
      'createdBy',
      'name email'
    );

    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Ownership & permission check
    const isOwner = project.createdBy._id.toString() === req.user._id.toString();
    const canViewAll =
      req.user.role === ROLES.SUPER_ADMIN ||
      req.user.permissions?.includes(PERMISSIONS.PROJECTS_VIEW_ALL);

    if (!isOwner && !canViewAll) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const [figma, website, mappings, testRuns, bugs] = await Promise.all([
      FigmaConnection.findOne({ projectId: project._id }),
      Website.findOne({ projectId: project._id }),
      PageMapping.find({ projectId: project._id }),
      TestRun.find({ projectId: project._id }).sort({ createdAt: -1 }).limit(10),
      Bug.find({ projectId: project._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    return sendSuccess(res, {
      project,
      figma,
      website,
      mappings,
      testRuns,
      bugs,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const isOwner = project.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== ROLES.SUPER_ADMIN) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();

    await logAudit({
      actorUserId: req.user._id,
      action: 'project.update',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      metadata: { name: project.name, status: project.status },
      req,
    });

    return sendSuccess(res, { project }, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isDeleted: false });
    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const isOwner = project.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== ROLES.SUPER_ADMIN) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Soft delete
    project.isDeleted = true;
    project.status = 'archived';
    await project.save();

    await logAudit({
      actorUserId: req.user._id,
      action: 'project.delete',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      metadata: { name: project.name },
      req,
    });

    return sendSuccess(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};
