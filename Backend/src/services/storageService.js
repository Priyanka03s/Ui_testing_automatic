import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { ENV } from '../config/env.js';

const BASE_DIR = path.resolve(process.cwd(), ENV.STORAGE_LOCAL_PATH);

// Ensure base directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(BASE_DIR);
ensureDir(path.join(BASE_DIR, 'references'));
ensureDir(path.join(BASE_DIR, 'screenshots'));
ensureDir(path.join(BASE_DIR, 'diffs'));
ensureDir(path.join(BASE_DIR, 'previews'));

const ALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.json',
  '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.woff', '.woff2', '.ttf', '.eot', '.ico', '.txt', '.map'
]);

export const StorageService = {
  /**
   * Save a buffer or string to storage
   */
  async saveFile(subDir, fileName, buffer) {
    const targetDir = path.join(BASE_DIR, subDir);
    ensureDir(targetDir);

    // Sanitize filename
    const cleanFileName = path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(targetDir, cleanFileName);

    await fs.promises.writeFile(filePath, buffer);
    const storageKey = `${subDir}/${cleanFileName}`;
    return {
      storageKey,
      filePath,
      publicUrl: this.getPublicUrl(storageKey),
    };
  },

  /**
   * Get public/proxy URL for a file
   */
  getPublicUrl(storageKey) {
    if (!storageKey) return '';
    return `${ENV.PREVIEW_BASE_URL}/api/storage/${storageKey}`;
  },

  /**
   * Retrieve file path and check existence
   */
  getFilePath(storageKey) {
    if (!storageKey) return null;
    const safePath = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(BASE_DIR, safePath);
    if (!absolutePath.startsWith(BASE_DIR)) {
      throw new Error('Access denied: Path traversal attempted');
    }
    return fs.existsSync(absolutePath) ? absolutePath : null;
  },

  /**
   * Delete a file
   */
  async deleteFile(storageKey) {
    const filePath = this.getFilePath(storageKey);
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  },

  /**
   * Extract ZIP archive with strict security checks against path traversal & zip bombs
   */
  async extractZip(zipBuffer, previewId) {
    const targetDir = path.join(BASE_DIR, 'previews', previewId);
    ensureDir(targetDir);

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    const MAX_FILES = 500;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB max uncompressed

    if (zipEntries.length > MAX_FILES) {
      throw new Error(`Archive exceeds maximum allowed files (${MAX_FILES})`);
    }

    let totalExtractedSize = 0;
    let hasIndexHtml = false;

    // First validate all entries before writing
    for (const entry of zipEntries) {
      const entryName = entry.entryName;

      // Check path traversal
      if (entryName.includes('..') || path.isAbsolute(entryName)) {
        throw new Error(`Dangerous path traversal detected in archive: ${entryName}`);
      }

      totalExtractedSize += entry.header.size;
      if (totalExtractedSize > MAX_TOTAL_SIZE) {
        throw new Error('Archive total uncompressed size exceeds maximum allowed 50MB limit');
      }

      if (!entry.isDirectory) {
        const ext = path.extname(entryName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          throw new Error(`Disallowed file type in archive: ${entryName} (${ext})`);
        }

        const normalizedName = entryName.replace(/\\/g, '/');
        if (normalizedName === 'index.html' || normalizedName.endsWith('/index.html')) {
          hasIndexHtml = true;
        }
      }
    }

    if (!hasIndexHtml) {
      throw new Error('Static website archive must contain an index.html file');
    }

    // Determine if root folder wrapping exists (e.g. dist/index.html)
    let stripPrefix = '';
    const rootIndex = zipEntries.find(e => !e.isDirectory && (e.entryName === 'index.html' || e.entryName === './index.html'));

    if (!rootIndex) {
      const nestedIndex = zipEntries.find(e => !e.isDirectory && e.entryName.endsWith('/index.html'));
      if (nestedIndex) {
        const parts = nestedIndex.entryName.split('/');
        parts.pop(); // remove index.html
        stripPrefix = parts.join('/') + '/';
      }
    }

    // Safely extract entries
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      let relativePath = entry.entryName.replace(/\\/g, '/');
      if (stripPrefix && relativePath.startsWith(stripPrefix)) {
        relativePath = relativePath.slice(stripPrefix.length);
      }
      if (!relativePath) continue;

      const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
      const fullDestPath = path.join(targetDir, safePath);

      if (!fullDestPath.startsWith(targetDir)) {
        throw new Error('Security violation: Attempted path extraction outside target directory');
      }

      ensureDir(path.dirname(fullDestPath));
      await fs.promises.writeFile(fullDestPath, entry.getData());
    }

    return {
      previewId,
      previewDir: targetDir,
      previewUrl: `${ENV.PREVIEW_BASE_URL}/preview/${previewId}/`,
    };
  },
};
