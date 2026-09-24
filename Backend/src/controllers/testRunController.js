import { TestRun } from '../models/TestRun.js';
import { Project } from '../models/Project.js';
import { PageMapping } from '../models/PageMapping.js';
import { PageResult } from '../models/PageResult.js';
import { Bug } from '../models/Bug.js';
import { TestRunnerWorker } from '../services/testRunnerWorker.js';
import { TEST_STATUS, PROJECT_STATUS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const createTestRun = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { viewportWidth, viewportHeight, browser } = req.body;

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const mappingCount = await PageMapping.countDocuments({ projectId, enabled: true });
    if (mappingCount === 0) {
      return sendError(
        res,
        'Cannot start test: Please configure at least one enabled Figma to website page mapping first.',
        400,
        'NO_MAPPINGS_CONFIGURED'
      );
    }

    const testRun = await TestRun.create({
      projectId,
      startedBy: req.user._id,
      status: TEST_STATUS.QUEUED,
      viewportWidth: viewportWidth || 1440,
      viewportHeight: viewportHeight || 900,
      browser: browser || 'chromium',
    });

    project.status = PROJECT_STATUS.TESTING;
    await project.save();

    await logAudit({
      actorUserId: req.user._id,
      action: 'test.run_started',
      resourceType: 'TestRun',
      resourceId: testRun._id.toString(),
      metadata: { projectId, viewport: `${testRun.viewportWidth}x${testRun.viewportHeight}` },
      req,
    });

    // Proactively trigger worker in background
    setTimeout(() => {
      TestRunnerWorker.processNextJob().catch((err) =>
        console.error('[Worker Trigger Error]:', err)
      );
    }, 50);

    return sendSuccess(
      res,
      {
        testRunId: testRun._id,
        status: testRun.status,
      },
      'Visual test run queued successfully',
      202
    );
  } catch (error) {
    next(error);
  }
};

export const getTestRuns = async (req, res, next) => {
  try {
    const runs = await TestRun.find({ projectId: req.params.id })
      .populate('startedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { testRuns: runs });
  } catch (error) {
    next(error);
  }
};

export const getTestRunById = async (req, res, next) => {
  try {
    const testRun = await TestRun.findById(req.params.id).populate('startedBy', 'name email');
    if (!testRun) {
      return sendError(res, 'Test run not found', 404, 'TEST_RUN_NOT_FOUND');
    }

    const [pageResults, bugs] = await Promise.all([
      PageResult.find({ testRunId: testRun._id }).populate('pageMappingId'),
      Bug.find({ projectId: testRun.projectId }).sort({ severity: 1, createdAt: -1 }),
    ]);

    return sendSuccess(res, {
      testRun,
      pageResults,
      bugs,
    });
  } catch (error) {
    next(error);
  }
};

export const retryTestRun = async (req, res, next) => {
  try {
    const original = await TestRun.findById(req.params.id);
    if (!original) {
      return sendError(res, 'Original test run not found', 404, 'TEST_RUN_NOT_FOUND');
    }

    const newRun = await TestRun.create({
      projectId: original.projectId,
      startedBy: req.user._id,
      status: TEST_STATUS.QUEUED,
      viewportWidth: original.viewportWidth,
      viewportHeight: original.viewportHeight,
      browser: original.browser,
    });

    setTimeout(() => {
      TestRunnerWorker.processNextJob().catch(console.error);
    }, 50);

    return sendSuccess(res, { testRunId: newRun._id, status: newRun.status }, 'Test rerun queued');
  } catch (error) {
    next(error);
  }
};

export const cancelTestRun = async (req, res, next) => {
  try {
    const testRun = await TestRun.findById(req.params.id);
    if (!testRun) {
      return sendError(res, 'Test run not found', 404, 'TEST_RUN_NOT_FOUND');
    }

    if (testRun.status === TEST_STATUS.COMPLETED || testRun.status === TEST_STATUS.FAILED) {
      return sendError(res, 'Cannot cancel an already completed test run', 400, 'INVALID_STATE');
    }

    testRun.status = TEST_STATUS.CANCELLED;
    await testRun.save();

    return sendSuccess(res, { testRun }, 'Test run cancelled');
  } catch (error) {
    next(error);
  }
};
