import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { connectFigma, getFigmaConnection, importFigmaFrames } from '../controllers/figmaController.js';
import { uploadStaticWebsite, generateAiWebsite, getWebsite } from '../controllers/websiteController.js';
import { createPageMapping, getPageMappings } from '../controllers/pageMappingController.js';
import { createTestRun, getTestRuns } from '../controllers/testRunController.js';
import { getBugsByProject } from '../controllers/bugController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidators.js';
import { aiLimiter, testRunLimiter } from '../middleware/rateLimiter.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max upload
});

const router = Router();

// Core Project CRUD
router.post('/', requireAuth, validate(createProjectSchema), createProject);
router.get('/', requireAuth, getProjects);
router.get('/:id', requireAuth, getProjectById);
router.patch('/:id', requireAuth, validate(updateProjectSchema), updateProject);
router.delete('/:id', requireAuth, deleteProject);

// Figma endpoints nested by project
router.post('/:id/figma/connect', requireAuth, connectFigma);
router.get('/:id/figma', requireAuth, getFigmaConnection);
router.post('/:id/figma/import', requireAuth, importFigmaFrames);

// Website endpoints nested by project
router.post('/:id/websites/upload', requireAuth, upload.single('file'), uploadStaticWebsite);
router.post('/:id/websites/generate', requireAuth, aiLimiter, generateAiWebsite);
router.get('/:id/websites', requireAuth, getWebsite);

// Page Mapping endpoints nested by project
router.post('/:id/page-mappings', requireAuth, createPageMapping);
router.get('/:id/page-mappings', requireAuth, getPageMappings);

// Test Run endpoints nested by project
router.post('/:id/test-runs', requireAuth, testRunLimiter, createTestRun);
router.get('/:id/test-runs', requireAuth, getTestRuns);

// Bug endpoints nested by project
router.get('/:id/bugs', requireAuth, getBugsByProject);

export default router;
