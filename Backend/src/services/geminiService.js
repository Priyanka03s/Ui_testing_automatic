import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';
import { z } from 'zod';
import { ALLOWED_COMPONENT_TYPES, BUG_SEVERITY, BUG_CATEGORY } from '../config/constants.js';

// Strict Zod schema for AI generated website themes
export const themeSchema = z.object({
  theme: z.object({
    primaryColor: z.string().default('#0f172a'),
    secondaryColor: z.string().default('#ffffff'),
    accentColor: z.string().default('#3b82f6'),
    fontFamily: z.string().default('Inter'),
    borderRadius: z.string().default('8px'),
  }),
  pages: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      sections: z.array(
        z.object({
          type: z.enum(ALLOWED_COMPONENT_TYPES),
          props: z.record(z.any()).default({}),
        })
      ),
    })
  ).min(1),
});

// Strict Zod schema for bug analysis
export const bugAnalysisSchema = z.object({
  issues: z.array(
    z.object({
      title: z.string(),
      pageName: z.string().default('Page'),
      category: z.enum(Object.values(BUG_CATEGORY)).default('layout'),
      severity: z.enum(Object.values(BUG_SEVERITY)).default('medium'),
      description: z.string(),
      suggestedFix: z.string(),
      confidence: z.number().min(0).max(1).default(0.85),
    })
  ),
});

export class GeminiService {
  static getClient() {
    if (!ENV.GEMINI_API_KEY) {
      return null;
    }
    return new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
  }

  static async checkHealth() {
    if (!ENV.GEMINI_API_KEY) {
      return { configured: false, status: 'missing_api_key' };
    }
    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({ model: ENV.GEMINI_MODEL || 'gemini-2.5-flash' });
      // Test basic call
      const result = await model.generateContent('ping');
      const text = result.response.text();
      return {
        configured: true,
        status: 'healthy',
        model: ENV.GEMINI_MODEL,
        responseReceived: !!text,
      };
    } catch (err) {
      return {
        configured: true,
        status: 'error',
        model: ENV.GEMINI_MODEL,
        error: err.message,
      };
    }
  }

  /**
   * Generate safe website theme JSON based on text prompt
   */
  static async generateWebsiteTheme(prompt) {
    const defaultTheme = {
      theme: {
        primaryColor: '#0f172a',
        secondaryColor: '#f8fafc',
        accentColor: '#3b82f6',
        fontFamily: 'Inter',
        borderRadius: '8px',
      },
      pages: [
        {
          name: 'Home',
          path: '/',
          sections: [
            { type: 'navbar', props: { brand: 'DesignCheck Store', links: ['Home', 'Products', 'About', 'Contact'] } },
            { type: 'hero', props: { headline: 'Automated Visual Verification', subheadline: 'Compare your live website directly against your Figma prototypes in seconds.', ctaText: 'Explore Collection' } },
            { type: 'productGrid', props: { title: 'Featured Products', columns: 4, itemsCount: 4 } },
            { type: 'newsletter', props: { title: 'Join our Design Community', placeholder: 'Enter your email' } },
            { type: 'footer', props: { copyright: '© 2026 DesignCheck AI. All rights reserved.' } },
          ],
        },
        {
          name: 'Products',
          path: '/products',
          sections: [
            { type: 'navbar', props: { brand: 'DesignCheck Store' } },
            { type: 'heading', props: { text: 'All Catalog Products' } },
            { type: 'productGrid', props: { title: 'All Items', columns: 3, itemsCount: 6 } },
            { type: 'footer', props: {} },
          ],
        },
      ],
    };

    if (!ENV.GEMINI_API_KEY) {
      return defaultTheme;
    }

    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({
        model: ENV.GEMINI_MODEL || 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const systemPrompt = `You are a safe website theme architect. Return ONLY valid JSON adhering strictly to this schema:
{
  "theme": {
    "primaryColor": "hex string",
    "secondaryColor": "hex string",
    "accentColor": "hex string",
    "fontFamily": "Inter or system-ui",
    "borderRadius": "string like 8px or 12px"
  },
  "pages": [
    {
      "name": "Home",
      "path": "/",
      "sections": [
        {
          "type": one of ${JSON.stringify(ALLOWED_COMPONENT_TYPES)},
          "props": {}
        }
      ]
    }
  ]
}
Do NOT include executable script tags, iframe, or raw HTML. Only use allowed component types: ${ALLOWED_COMPONENT_TYPES.join(', ')}.`;

      const response = await model.generateContent(`${systemPrompt}\nUser prompt: "${prompt}"`);
      const responseText = response.response.text();
      const parsed = JSON.parse(responseText);

      // Validate with Zod
      const validated = themeSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn(`[Gemini Theme Warning] Falling back to default theme: ${err.message}`);
      return defaultTheme;
    }
  }

  /**
   * Analyze visual difference regions and produce structured QA bug reports
   */
  static async analyzeVisualDifferences({ pageName, route, matchPercentage, regions, totalPixels, diffPixels }) {
    // Deterministic fallback generator in case AI is offline or quota exceeded
    const fallbackIssues = (regions || []).map((r, i) => {
      let category = 'spacing';
      let severity = 'medium';

      if (r.area > 50000 || r.differencePercentage > 10) {
        severity = 'high';
        category = 'layout';
      } else if (r.y < 120) {
        category = 'alignment';
        severity = 'medium';
      } else if (r.area < 2000) {
        category = 'typography';
        severity = 'low';
      }

      return {
        title: `Visual mismatch in ${pageName} (${category.toUpperCase()})`,
        pageName: pageName || 'Page',
        category,
        severity,
        description: `Discrepancy observed at coordinates (${r.x}px, ${r.y}px) spanning ${r.width}x${r.height}px. Difference accounts for approx ${r.differencePercentage}% of screen area.`,
        suggestedFix: `Inspect layout spacing, container margins, or element alignment near (${r.x}, ${r.y}).`,
        confidence: 0.88,
      };
    });

    if (!ENV.GEMINI_API_KEY || !regions || regions.length === 0) {
      return fallbackIssues;
    }

    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({
        model: ENV.GEMINI_MODEL || 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `You are a senior UI QA automation engineer analyzing visual discrepancies between a Figma design reference and the live rendered website.
Page: "${pageName}" (Route: "${route}")
Visual Match Score: ${matchPercentage}%
Changed Pixels: ${diffPixels} / ${totalPixels}
Detected Difference Regions:
${JSON.stringify(regions, null, 2)}

Provide structured bug reports for the detected difference regions.
For each issue, return:
- title: concise descriptive title (e.g. "Hero CTA position mismatch", "Header spacing deviation")
- pageName: "${pageName}"
- category: one of ["layout", "spacing", "typography", "color", "image", "alignment", "component_size", "visibility", "responsive", "other"]
- severity: one of ["critical", "high", "medium", "low"]
- description: clear explanation of the observed fact (do NOT claim exact source code line numbers without code evidence)
- suggestedFix: suggested investigation area (e.g. "Inspect CSS gap or padding on hero flex container")
- confidence: number between 0.0 and 1.0

Return format:
{
  "issues": [ ... ]
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);
      const validated = bugAnalysisSchema.parse(parsed);

      return validated.issues.length > 0 ? validated.issues : fallbackIssues;
    } catch (err) {
      console.warn(`[Gemini Diff Analysis Warning] Falling back to deterministic analysis: ${err.message}`);
      return fallbackIssues;
    }
  }
}
