import { Bug } from '../models/Bug.js';
import { BUG_STATUS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const getBugsByProject = async (req, res, next) => {
  try {
    const { status, severity, category } = req.query;
    const query = { projectId: req.params.id };

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (category) query.category = category;

    const bugs = await Bug.find(query).populate('pageResultId').sort({ createdAt: -1 });
    return sendSuccess(res, { bugs });
  } catch (error) {
    next(error);
  }
};

export const getBugById = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id).populate('pageResultId');
    if (!bug) {
      return sendError(res, 'Bug not found', 404, 'BUG_NOT_FOUND');
    }
    return sendSuccess(res, { bug });
  } catch (error) {
    next(error);
  }
};

export const updateBugStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!Object.values(BUG_STATUS).includes(status)) {
      return sendError(res, 'Invalid bug status', 400, 'INVALID_STATUS');
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return sendError(res, 'Bug not found', 404, 'BUG_NOT_FOUND');
    }

    bug.status = status;
    if (status === BUG_STATUS.RESOLVED) {
      bug.resolvedAt = new Date();
    } else {
      bug.resolvedAt = null;
    }

    await bug.save();

    await logAudit({
      actorUserId: req.user._id,
      action: `bug.status_updated_${status}`,
      resourceType: 'Bug',
      resourceId: bug._id.toString(),
      metadata: { bugTitle: bug.title, newStatus: status },
      req,
    });

    return sendSuccess(res, { bug }, `Bug marked as ${status}`);
  } catch (error) {
    next(error);
  }
};
