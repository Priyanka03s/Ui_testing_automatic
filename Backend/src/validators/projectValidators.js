import { z } from 'zod';
import { PROJECT_STATUS } from '../config/constants.js';

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().default(''),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(Object.values(PROJECT_STATUS)).optional(),
});
