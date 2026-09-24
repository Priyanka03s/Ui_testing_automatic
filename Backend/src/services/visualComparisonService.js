import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { StorageService } from './storageService.js';
import { detectDifferenceRegions } from '../utils/diffClustering.js';

export class VisualComparisonService {
  /**
   * Compares Figma reference PNG with actual website screenshot PNG
   * @param {Buffer|string} referenceInput - buffer or file path
   * @param {Buffer|string} actualInput - buffer or file path
   * @param {Object} options
   */
  static async compare(referenceInput, actualInput, options = {}) {
    const {
      targetWidth = 1440,
      targetHeight = 900,
      threshold = 0.1, // pixelmatch threshold (0 to 1, default 0.1)
    } = options;

    const refBufferRaw = Buffer.isBuffer(referenceInput)
      ? referenceInput
      : await fs.promises.readFile(referenceInput);

    const actBufferRaw = Buffer.isBuffer(actualInput)
      ? actualInput
      : await fs.promises.readFile(actualInput);

    // Normalize both images to identical dimensions using sharp
    const refNormalized = await sharp(refBufferRaw)
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const actNormalized = await sharp(actBufferRaw)
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = refNormalized.info.width;
    const height = refNormalized.info.height;
    const totalPixels = width * height;

    // Create diff buffer
    const diffPng = new PNG({ width, height });

    const diffPixels = pixelmatch(
      refNormalized.data,
      actNormalized.data,
      diffPng.data,
      width,
      height,
      {
        threshold,
        diffColor: [239, 68, 68], // Tailwind red-500 for diff highlight
        diffColorAlt: [249, 115, 22], // orange-500
        alpha: 0.8,
        includeAA: false, // ignore subtle antialiasing noise
      }
    );

    // Calculate similarity score percentage clamped between 0 and 100
    const matchPercentage = Math.max(
      0,
      Math.min(100, parseFloat(((1 - diffPixels / totalPixels) * 100).toFixed(1)))
    );

    // Connected component clustering to extract prominent bounding boxes
    const regions = detectDifferenceRegions(diffPng.data, width, height, {
      gridSize: 8,
      mergeGap: 24,
      minRegionArea: 100,
    });

    // Save diff PNG to storage
    const diffBuffer = PNG.sync.write(diffPng);
    const diffFilename = `diff_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const savedDiff = await StorageService.saveFile('diffs', diffFilename, diffBuffer);

    return {
      matchPercentage,
      diffPixels,
      totalPixels,
      regions,
      diffScreenshotUrl: savedDiff.publicUrl,
      diffStorageKey: savedDiff.storageKey,
      status: matchPercentage >= 95 ? 'passed' : matchPercentage >= 80 ? 'warning' : 'failed',
    };
  }
}
