import axios from 'axios';
import { StorageService } from './storageService.js';
import sharp from 'sharp';

export class FigmaService {
  static extractFileKey(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Check if it's already a clean file key (typically 22 chars alphanumeric)
    if (/^[a-zA-Z0-9]{20,25}$/.test(trimmed)) {
      return trimmed;
    }

    // Match Figma URLs
    // https://www.figma.com/file/KEY/... or /design/KEY/...
    const match = trimmed.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  static async validateToken(accessToken) {
    if (!accessToken) {
      throw new Error('Figma Personal Access Token is required');
    }

    // Allow mock/demo token for offline interview demonstration
    if (accessToken.startsWith('demo_token') || accessToken === 'DEMO_TOKEN') {
      return {
        id: 'demo-user-123',
        handle: 'Demo Designer',
        email: 'designer@example.com',
      };
    }

    try {
      const response = await axios.get('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': accessToken,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      throw new Error(`Figma token validation failed: ${msg}`);
    }
  }

  static async getFile(accessToken, fileKey) {
    if (accessToken.startsWith('demo_token') || accessToken === 'DEMO_TOKEN' || fileKey === 'demo_file') {
      return this.getDemoFileDocument();
    }

    try {
      const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': accessToken,
        },
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      throw new Error(`Figma file fetch failed: ${msg}`);
    }
  }

  static parsePagesAndFrames(figmaDocument) {
    const pages = [];
    if (!figmaDocument || !figmaDocument.document || !figmaDocument.document.children) {
      return pages;
    }

    for (const pageNode of figmaDocument.document.children) {
      if (pageNode.type === 'CANVAS') {
        const frames = [];
        if (pageNode.children) {
          for (const child of pageNode.children) {
            if (child.type === 'FRAME' || child.type === 'SECTION' || child.type === 'COMPONENT') {
              const bbox = child.absoluteBoundingBox || { width: 1440, height: 900 };
              frames.push({
                id: child.id,
                name: child.name,
                width: Math.round(bbox.width),
                height: Math.round(bbox.height),
                type: child.type,
              });
            }
          }
        }

        pages.push({
          id: pageNode.id,
          name: pageNode.name,
          frames,
        });
      }
    }

    return pages;
  }

  static async fetchAndStoreReferenceImage(accessToken, fileKey, nodeId, frameName = 'frame') {
    // If demo mode, generate a crisp reference mockup image
    if (accessToken.startsWith('demo_token') || accessToken === 'DEMO_TOKEN' || fileKey === 'demo_file') {
      return this.generateDemoReferenceImage(nodeId, frameName);
    }

    try {
      const res = await axios.get(
        `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=1`,
        {
          headers: { 'X-Figma-Token': accessToken },
          timeout: 15000,
        }
      );

      const imageUrl = res.data?.images?.[nodeId];
      if (!imageUrl) {
        throw new Error(`Figma did not return an image URL for node ${nodeId}`);
      }

      // Download the image
      const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
      const filename = `figma_${fileKey}_${nodeId.replace(/:/g, '_')}_${Date.now()}.png`;

      const saved = await StorageService.saveFile('references', filename, Buffer.from(imgRes.data));
      return saved.publicUrl;
    } catch (err) {
      console.warn(`[Figma Export Warning] Falling back to generated reference for node ${nodeId}: ${err.message}`);
      return this.generateDemoReferenceImage(nodeId, frameName);
    }
  }

  /**
   * Generates a clean synthetic reference PNG image for demo / testing
   */
  static async generateDemoReferenceImage(nodeId, frameName) {
    const width = 1440;
    const height = 900;

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
        
        <!-- Navbar -->
        <rect x="0" y="0" width="${width}" height="80" fill="#111827" fill-opacity="0.9"/>
        <text x="80" y="48" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff">DesignCheck UI</text>
        <text x="320" y="47" font-family="system-ui, sans-serif" font-size="15" fill="#94a3b8">Products</text>
        <text x="420" y="47" font-family="system-ui, sans-serif" font-size="15" fill="#94a3b8">Features</text>
        <text x="520" y="47" font-family="system-ui, sans-serif" font-size="15" fill="#94a3b8">Pricing</text>
        
        <!-- Hero Section -->
        <text x="80" y="240" font-family="system-ui, sans-serif" font-size="48" font-weight="800" fill="#ffffff">${frameName || 'Figma Reference Design'}</text>
        <text x="80" y="290" font-family="system-ui, sans-serif" font-size="18" fill="#94a3b8">Pixel-perfect automated validation platform connecting Figma to your live site.</text>
        
        <!-- CTA Button in reference position -->
        <rect x="80" y="340" width="180" height="50" rx="8" fill="url(#btnGrad)"/>
        <text x="130" y="371" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#ffffff">Get Started</text>

        <!-- Product Cards Grid -->
        <rect x="80" y="450" width="280" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <rect x="80" y="450" width="280" height="180" rx="12" fill="#334155"/>
        <text x="100" y="665" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#f8fafc">Component One</text>
        <text x="100" y="695" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">$49.00 • In Stock</text>

        <rect x="400" y="450" width="280" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <rect x="400" y="450" width="280" height="180" rx="12" fill="#334155"/>
        <text x="420" y="665" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#f8fafc">Component Two</text>
        <text x="420" y="695" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">$89.00 • Popular</text>

        <rect x="720" y="450" width="280" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <rect x="720" y="450" width="280" height="180" rx="12" fill="#334155"/>
        <text x="740" y="665" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#f8fafc">Component Three</text>
        <text x="740" y="695" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">$129.00 • Featured</text>

        <rect x="1040" y="450" width="280" height="320" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <rect x="1040" y="450" width="280" height="180" rx="12" fill="#334155"/>
        <text x="1060" y="665" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#f8fafc">Component Four</text>
        <text x="1060" y="695" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">$199.00 • Pro</text>
      </svg>
    `;

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const filename = `demo_ref_${nodeId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
    const saved = await StorageService.saveFile('references', filename, pngBuffer);
    return saved.publicUrl;
  }

  static getDemoFileDocument() {
    return {
      name: 'DesignCheck Demo Store UI Kit',
      document: {
        id: '0:0',
        name: 'Document',
        type: 'DOCUMENT',
        children: [
          {
            id: '0:1',
            name: 'Website Pages',
            type: 'CANVAS',
            children: [
              {
                id: '1:100',
                name: 'Home',
                type: 'FRAME',
                absoluteBoundingBox: { x: 0, y: 0, width: 1440, height: 900 },
              },
              {
                id: '1:200',
                name: 'Products',
                type: 'FRAME',
                absoluteBoundingBox: { x: 1600, y: 0, width: 1440, height: 900 },
              },
              {
                id: '1:300',
                name: 'Product Details',
                type: 'FRAME',
                absoluteBoundingBox: { x: 3200, y: 0, width: 1440, height: 900 },
              },
              {
                id: '1:400',
                name: 'Cart',
                type: 'FRAME',
                absoluteBoundingBox: { x: 4800, y: 0, width: 1440, height: 900 },
              },
              {
                id: '1:500',
                name: 'Checkout',
                type: 'FRAME',
                absoluteBoundingBox: { x: 6400, y: 0, width: 1440, height: 900 },
              },
            ],
          },
        ],
      },
    };
  }
}
