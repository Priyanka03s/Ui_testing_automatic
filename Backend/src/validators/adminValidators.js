import { z } from 'zod';
import { ROLES, ALL_PERMISSIONS } from '../config/constants.js';

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum([ROLES.ADMIN_L2, ROLES.ADMIN_L3], {
    errorMap: () => ({ message: 'Role must be either ADMIN_L2 or ADMIN_L3' }),
  }),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).default([]),
});

export const updateAdminPermissionsSchema = z.object({
  permissions: z.array(z.enum(ALL_PERMISSIONS)),
});
