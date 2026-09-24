import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { VisualComparisonService } from '../../src/services/visualComparisonService.js';
import { detectDifferenceRegions } from '../../src/utils/diffClustering.js';

describe('Visual Comparison Engine', () => {
  const refPath = path.join(process.cwd(), 'tests', 'fixtures', 'reference.png');
  const actPath = path.join(process.cwd(), 'tests', 'fixtures', 'actual.png');

  it('should compare reference and actual PNGs and detect differences', async () => {
    expect(fs.existsSync(refPath)).toBe(true);
    expect(fs.existsSync(actPath)).toBe(true);

    const result = await VisualComparisonService.compare(refPath, actPath, {
      targetWidth: 400,
      targetHeight: 300,
    });

    expect(result).toHaveProperty('matchPercentage');
    expect(result).toHaveProperty('diffPixels');
    expect(result).toHaveProperty('regions');
    expect(result).toHaveProperty('diffScreenshotUrl');

    // Button moved by 30px, so similarity should be high but less than 100%
    expect(result.matchPercentage).toBeGreaterThan(80);
    expect(result.matchPercentage).toBeLessThan(100);
    expect(result.diffPixels).toBeGreaterThan(0);
  });

  it('should detect bounding boxes for difference regions', async () => {
    const result = await VisualComparisonService.compare(refPath, actPath, {
      targetWidth: 400,
      targetHeight: 300,
    });

    expect(Array.isArray(result.regions)).toBe(true);
    expect(result.regions.length).toBeGreaterThan(0);

    const firstRegion = result.regions[0];
    expect(firstRegion).toHaveProperty('x');
    expect(firstRegion).toHaveProperty('y');
    expect(firstRegion).toHaveProperty('width');
    expect(firstRegion).toHaveProperty('height');
    expect(firstRegion.width).toBeGreaterThan(0);
    expect(firstRegion.height).toBeGreaterThan(0);
  });
});
