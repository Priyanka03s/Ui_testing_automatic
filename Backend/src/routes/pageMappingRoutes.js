import { Router } from 'express';
import { updatePageMapping, deletePageMapping } from '../controllers/pageMappingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.patch('/:id', requireAuth, updatePageMapping);
router.delete('/:id', requireAuth, deletePageMapping);

export default router;
