import { Router } from 'express';
import { getHealth, getDbHealth, getAiHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);
router.get('/db', getDbHealth);
router.get('/ai', getAiHealth);

export default router;
