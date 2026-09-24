import { Router } from 'express';
import { getTestRunById, retryTestRun, cancelTestRun } from '../controllers/testRunController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:id', requireAuth, getTestRunById);
router.post('/:id/retry', requireAuth, retryTestRun);
router.post('/:id/cancel', requireAuth, cancelTestRun);

export default router;
