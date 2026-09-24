import { Router } from 'express';
import { getBugById, updateBugStatus } from '../controllers/bugController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:id', requireAuth, getBugById);
router.patch('/:id/status', requireAuth, updateBugStatus);

export default router;
