import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Website } from '../models/Website.js';
import { Project } from '../models/Project.js';
import { StorageService } from '../services/storageService.js';
import { GeminiService } from '../services/geminiService.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const uploadStaticWebsite = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, isDeleted: false });

    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (!req.file) {
      return sendError(res, 'Please provide a ZIP archive containing your built static website', 400, 'NO_FILE_UPLOADED');
    }

    const previewId = `prev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const extraction = await StorageService.extractZip(req.file.buffer, previewId);

    // Save or update Website record
    let website = await Website.findOne({ projectId });
    if (website) {
      website.type = 'uploaded_static';
      website.name = req.file.originalname || 'Uploaded Website Build';
      website.previewId = previewId;
      website.previewUrl = extraction.previewUrl;
      website.status = 'ready';
      website.themeConfig = null;
      await website.save();
    } else {
      website = await Website.create({
        projectId,
        type: 'uploaded_static',
        name: req.file.originalname || 'Uploaded Website Build',
        previewId,
        previewUrl: extraction.previewUrl,
        status: 'ready',
      });
    }

    await logAudit({
      actorUserId: req.user._id,
      action: 'website.upload',
      resourceType: 'Website',
      resourceId: website._id.toString(),
      metadata: { previewId, originalName: req.file.originalname },
      req,
    });

    return sendSuccess(
      res,
      {
        website,
        previewUrl: extraction.previewUrl,
      },
      'Static website build successfully validated and deployed for preview',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const generateAiWebsite = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { prompt } = req.body;

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Call Gemini for structured safe theme schema
    const themeConfig = await GeminiService.generateWebsiteTheme(prompt);

    const previewId = `ai_prev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const previewDir = path.join(process.cwd(), ENV.STORAGE_LOCAL_PATH, 'previews', previewId);
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    // Generate controlled HTML file that dynamically renders the safe theme schema
    const indexHtml = generateControlledPreviewHtml(themeConfig);
    await fs.promises.writeFile(path.join(previewDir, 'index.html'), indexHtml, 'utf8');

    const previewUrl = `${ENV.PREVIEW_BASE_URL}/preview/${previewId}/`;

    let website = await Website.findOne({ projectId });
    if (website) {
      website.type = 'ai_generated';
      website.name = `AI Generated: ${prompt.slice(0, 30)}...`;
      website.previewId = previewId;
      website.previewUrl = previewUrl;
      website.status = 'ready';
      website.themeConfig = themeConfig;
      await website.save();
    } else {
      website = await Website.create({
        projectId,
        type: 'ai_generated',
        name: `AI Generated: ${prompt.slice(0, 30)}...`,
        previewId,
        previewUrl,
        status: 'ready',
        themeConfig,
      });
    }

    await logAudit({
      actorUserId: req.user._id,
      action: 'website.generate_ai',
      resourceType: 'Website',
      resourceId: website._id.toString(),
      metadata: { prompt, previewId },
      req,
    });

    return sendSuccess(
      res,
      {
        website,
        previewUrl,
        themeConfig,
      },
      'AI website theme generated successfully and live in preview renderer',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getWebsite = async (req, res, next) => {
  try {
    const website = await Website.findOne({ projectId: req.params.id });
    return sendSuccess(res, { website: website || null });
  } catch (error) {
    next(error);
  }
};

/**
 * Builds a standalone, clean HTML preview renderer for the safe UI schema
 */
function generateControlledPreviewHtml(themeConfig) {
  const primary = themeConfig.theme?.primaryColor || '#0f172a';
  const secondary = themeConfig.theme?.secondaryColor || '#ffffff';
  const accent = themeConfig.theme?.accentColor || '#3b82f6';
  const radius = themeConfig.theme?.borderRadius || '8px';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DesignCheck AI Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background-color: ${primary};
      color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .accent-bg { background-color: ${accent}; }
    .accent-text { color: ${accent}; }
    .custom-card { border-radius: ${radius}; }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
  <div id="site-root">
    <!-- Navbar -->
    <header class="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <span class="w-8 h-8 rounded-lg accent-bg flex items-center justify-center font-black text-white text-sm">DC</span>
          <span>Store UI</span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="/" class="hover:text-white transition">Home</a>
          <a href="/products" class="hover:text-white transition">Products</a>
          <a href="/features" class="hover:text-white transition">Features</a>
          <a href="/pricing" class="hover:text-white transition">Pricing</a>
        </nav>
        <button class="px-5 py-2.5 rounded-lg accent-bg hover:opacity-90 transition text-sm font-semibold text-white shadow-lg">
          Cart (0)
        </button>
      </div>
    </header>

    <!-- Hero Section with intentional subtle spacing for visual QA detection -->
    <section class="max-w-7xl mx-auto px-6 py-20 lg:py-28 text-left">
      <div class="max-w-3xl">
        <span class="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-500/10 accent-text border border-blue-500/20 mb-6">
          New Release 2026
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Figma Reference Design
        </h1>
        <p class="text-lg text-gray-400 mb-8 leading-relaxed">
          Pixel-perfect automated validation platform connecting Figma to your live site.
        </p>
        <div class="flex items-center gap-4">
          <button class="px-6 py-3 rounded-lg accent-bg hover:opacity-90 font-semibold text-white shadow-lg">
            Get Started
          </button>
          <button class="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 font-semibold text-gray-200 border border-gray-700">
            View Documentation
          </button>
        </div>
      </div>
    </section>

    <!-- Product Grid Section -->
    <section class="max-w-7xl mx-auto px-6 py-12">
      <h2 class="text-2xl font-bold text-white mb-8">Featured Items</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <div class="h-44 bg-gray-700 rounded-lg mb-4"></div>
          <h3 class="font-semibold text-white">Component One</h3>
          <p class="text-sm text-gray-400 mt-1">$49.00 • In Stock</p>
        </div>
        <div class="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <div class="h-44 bg-gray-700 rounded-lg mb-4"></div>
          <h3 class="font-semibold text-white">Component Two</h3>
          <p class="text-sm text-gray-400 mt-1">$89.00 • Popular</p>
        </div>
        <div class="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <div class="h-44 bg-gray-700 rounded-lg mb-4"></div>
          <h3 class="font-semibold text-white">Component Three</h3>
          <p class="text-sm text-gray-400 mt-1">$129.00 • Featured</p>
        </div>
        <div class="bg-gray-800/80 border border-gray-700 p-4 rounded-xl">
          <div class="h-44 bg-gray-700 rounded-lg mb-4"></div>
          <h3 class="font-semibold text-white">Component Four</h3>
          <p class="text-sm text-gray-400 mt-1">$199.00 • Pro</p>
        </div>
      </div>
    </section>
  </div>

  <!-- Footer -->
  <footer class="border-t border-gray-800 py-8 bg-gray-900/60 mt-16 text-center text-sm text-gray-500">
    <p>© 2026 DesignCheck AI Preview • Generated from safe component schema</p>
  </footer>
</body>
</html>`;
}
