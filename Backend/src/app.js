import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import mime from 'mime-types';
import fs from 'fs';

import { ENV } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { StorageService } from './services/storageService.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import pageMappingRoutes from './routes/pageMappingRoutes.js';
import testRunRoutes from './routes/testRunRoutes.js';
import bugRoutes from './routes/bugRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import previewRoutes from './routes/previewRoutes.js';

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows flexible preview rendering
    frameguard: false, // Allows iframe embedding from localhost:5173
  })
);

// CORS configuration with credentials support
const allowedOrigins = [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local development preview
    },
    credentials: true,
  })
);

// Request Parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Safe storage proxy endpoint for screenshots, diffs and references
app.get('/api/storage/*', (req, res) => {
  try {
    const rawStorageKey = req.params[0];
    const filePath = StorageService.getFilePath(rawStorageKey);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('Image file not found');
    }

    const contentType = mime.lookup(filePath) || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(403).send('Forbidden file access');
  }
});

// Website Preview Subsystem (for Playwright and user previews)
app.use('/preview', previewRoutes);

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/page-mappings', pageMappingRoutes);
app.use('/api/test-runs', testRunRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/health', healthRoutes);

// 404 Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

export default app;

