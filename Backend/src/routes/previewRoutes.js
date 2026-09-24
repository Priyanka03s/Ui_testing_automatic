import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { ENV } from '../config/env.js';

const router = Router();
const BASE_STORAGE_DIR = path.resolve(process.cwd(), ENV.STORAGE_LOCAL_PATH);

/**
 * Safe Static Website Preview server with SPA route fallback and path traversal guard
 * Route pattern: /preview/:previewId/*
 */
router.get('/:previewId*', (req, res) => {
  try {
    const { previewId } = req.params;
    // Sanitize previewId to alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(previewId)) {
      return res.status(400).send('Invalid preview identifier');
    }

    const previewDir = path.join(BASE_STORAGE_DIR, 'previews', previewId);
    if (!fs.existsSync(previewDir)) {
      return res.status(404).send('Preview website build not found or expired');
    }

    // Extract subpath after /:previewId
    let requestedSubPath = req.params[0] || '';
    if (requestedSubPath.startsWith('/')) {
      requestedSubPath = requestedSubPath.slice(1);
    }
    if (!requestedSubPath || requestedSubPath === '/') {
      requestedSubPath = 'index.html';
    }

    // Path traversal check
    const normalizedSubPath = path.normalize(requestedSubPath).replace(/^(\.\.[\/\\])+/, '');
    const absoluteTargetFile = path.join(previewDir, normalizedSubPath);

    if (!absoluteTargetFile.startsWith(previewDir)) {
      return res.status(403).send('Forbidden: Path traversal detected');
    }

    // If file exists on disk, serve it
    if (fs.existsSync(absoluteTargetFile) && fs.statSync(absoluteTargetFile).isFile()) {
      const contentType = mime.lookup(absoluteTargetFile) || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      return fs.createReadStream(absoluteTargetFile).pipe(res);
    }

    // SPA fallback: If requesting a route without file extension (e.g. /products, /cart, /checkout), fallback to index.html
    const indexHtmlFile = path.join(previewDir, 'index.html');
    if (fs.existsSync(indexHtmlFile)) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      return fs.createReadStream(indexHtmlFile).pipe(res);
    }

    return res.status(404).send('Preview file not found');
  } catch (err) {
    console.error('[Preview Server Error]', err);
    return res.status(500).send('Error serving preview resource');
  }
});

export default router;
