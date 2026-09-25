import axios from 'axios';
import { StorageService } from './storageService.js';
import sharp from 'sharp';

export class FigmaService {
  static extractFileKey(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Check if it's already a clean file key (typically 15-40 chars alphanumeric) or demo_file
    if (/^[a-zA-Z0-9_-]{15,40}$/.test(trimmed) || trimmed === 'demo_file') {
      return trimmed;
    }

    // Match Figma URLs
    // Supports /file/, /design/, /make/, /proto/, /board/
    const match = trimmed.match(/figma\.com\/(?:[a-zA-Z0-9_-]+\/)*(?:file|design|make|proto|board)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback for any other figma.com URL containing an alphanumeric key
    if (trimmed.includes('figma.com')) {
      const fallback = trimmed.match(/([a-zA-Z0-9]{20,30})/);
      if (fallback && fallback[1]) {
        return fallback[1];
      }
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
      const status = error.response?.status;
      const data = error.response?.data;
      const msg = data?.err || data?.message || error.message;

      // Figma granular access tokens often have file scopes (file_content:read, file_metadata:read)
      // but omit current_user:read. In that case, /v1/me returns a 403 scope error, which confirms
      // the token is authentic and valid for reading files.
      if (status === 403 && typeof msg === 'string' && (msg.toLowerCase().includes('scope') || msg.toLowerCase().includes('current_user:read'))) {
        return {
          id: 'figma-user',
          handle: 'Figma User',
        };
      }

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
      const msg = error.response?.data?.err || error.response?.data?.message || error.message;
      if (typeof msg === 'string' && msg.includes('File type not supported')) {
        throw new Error("Figma Make (/make/) files are code prototypes and cannot be fetched via Figma's REST API. Please provide a standard Figma Design file (/design/ or /file/) or click 'Use Demo Figma File'.");
      }
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
        <rect width="${width}" height="${height}" fill="#1e1e1e"/>
        <rect x="0" y="0" width="${width}" height="42" fill="#272727" fill-opacity="0.95"/>
        <circle cx="28" cy="21" r="4" fill="#34d399"/>
        <text x="38" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#e5e7eb">Figma Replica</text>

        <rect x="510" y="58" width="420" height="780" fill="#000000" stroke="#2e2e2e" stroke-width="1"/>

        <rect x="542" y="94" width="52" height="52" fill="#eb1d24"/>
        <text x="735" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="#eb1d24">Home</text>
        <text x="788" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="#eb1d24">About</text>
        <text x="840" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="#eb1d24">Services</text>
        <text x="900" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="#eb1d24">Contact</text>

        <rect x="542" y="210" width="145" height="178" fill="#edd624"/>
        <rect x="722" y="210" width="172" height="264" fill="#6b58dc"/>

        <text x="738" y="238" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">hi im priyanka from</text>
        <text x="738" y="257" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">coimbatore,im a</text>
        <text x="738" y="276" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">software developer</text>
        <text x="738" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">sgfrgdtgtdgtdghrt</text>
        <text x="738" y="314" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">dfvdddddddddddd</text>
        <text x="738" y="333" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">sdfvsds</text>
        <text x="738" y="352" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">SDfsdfsf</text>
        <text x="738" y="371" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">Sdfsddddddddd</text>
        <text x="738" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ffffff">dsfs</text>

        <rect x="552" y="688" width="335" height="84" fill="#eb1d24"/>
        <text x="719" y="742" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="400" fill="#ffffff" text-anchor="middle">Contact US</text>
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
