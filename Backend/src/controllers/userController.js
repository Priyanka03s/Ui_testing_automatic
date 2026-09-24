import { Project } from '../models/Project.js';
import { TestRun } from '../models/TestRun.js';
import { Bug } from '../models/Bug.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [projectsCount, testsCount, openBugsCount] = await Promise.all([
      Project.countDocuments({ createdBy: userId, isDeleted: false }),
      TestRun.countDocuments({ startedBy: userId }),
      Bug.countDocuments({
        status: 'open',
        projectId: {
          $in: await Project.find({ createdBy: userId, isDeleted: false }).distinct('_id'),
        },
      }),
    ]);

    return sendSuccess(res, {
      user: req.user.toJSON(),
      stats: {
        projectsCount,
        testsCount,
        openBugsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }
    if (typeof avatar === 'string') {
      user.avatar = avatar.trim();
    }

    // Role, permissions, isActive are explicitly protected from user tampering
    await user.save();

    return sendSuccess(res, { user: user.toJSON() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
