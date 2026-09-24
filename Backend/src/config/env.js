import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/designcheck_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_89438914',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FIGMA_ENCRYPTION_KEY: process.env.FIGMA_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH || './storage',
  PREVIEW_BASE_URL: process.env.PREVIEW_BASE_URL || 'http://localhost:5000',
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@designcheck.ai',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'AdminPass123!',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
};
