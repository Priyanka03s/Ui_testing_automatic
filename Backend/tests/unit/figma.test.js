import { describe, it, expect } from 'vitest';
import { FigmaService } from '../../src/services/figmaService.js';

describe('Figma Service & Document Parsing', () => {
  it('should accurately extract Figma file keys from different URL formats', () => {
    const url1 = 'https://www.figma.com/file/abc123XYZ456/Mobile-App-Design?node-id=0%3A1';
    const url2 = 'https://www.figma.com/design/def456UVW789/E-commerce-Store';
    const rawKey = 'abc123XYZ45678901234';

    expect(FigmaService.extractFileKey(url1)).toBe('abc123XYZ456');
    expect(FigmaService.extractFileKey(url2)).toBe('def456UVW789');
    expect(FigmaService.extractFileKey(rawKey)).toBe(rawKey);
    expect(FigmaService.extractFileKey('invalid-url')).toBe(null);
  });

  it('should parse pages and frames from a Figma document tree', () => {
    const demoDoc = FigmaService.getDemoFileDocument();
    const pages = FigmaService.parsePagesAndFrames(demoDoc);

    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0].name).toBe('Website Pages');

    const frames = pages[0].frames;
    expect(frames.length).toBe(5);
    expect(frames.map((f) => f.name)).toContain('Home');
    expect(frames.map((f) => f.name)).toContain('Products');
  });
});
