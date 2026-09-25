import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { TestRun } from '../models/TestRun.js';
import { Project } from '../models/Project.js';
import { PageMapping } from '../models/PageMapping.js';
import { Website } from '../models/Website.js';
import { PageResult } from '../models/PageResult.js';
import { Bug } from '../models/Bug.js';
import { VisualComparisonService } from './visualComparisonService.js';
import { FigmaService } from './figmaService.js';
import { GeminiService } from './geminiService.js';
import { StorageService } from './storageService.js';
import { validateSafeUrl } from '../utils/safeUrlValidator.js';
import { TEST_STATUS, PROJECT_STATUS } from '../config/constants.js';

export class TestRunnerWorker {
  static isProcessing = false;

  /**
   * Find and process next queued job
   */
  static async processNextJob() {
    if (this.isProcessing) return null;

    // Atomic lock using findOneAndUpdate
    const job = await TestRun.findOneAndUpdate(
      { status: TEST_STATUS.QUEUED },
      { status: TEST_STATUS.RUNNING, startedAt: new Date() },
      { sort: { createdAt: 1 }, new: true }
    );

    if (!job) return null;

    this.isProcessing = true;
    console.log(`[Worker] Started processing TestRun ${job._id} for Project ${job.projectId}`);

    try {
      await this.executeTestRun(job);
    } catch (err) {
      console.error(`[Worker Error] Job ${job._id} failed:`, err);
      job.status = TEST_STATUS.FAILED;
      job.errorMessage = err.message;
      job.completedAt = new Date();
      await job.save();

      await Project.findByIdAndUpdate(job.projectId, { status: PROJECT_STATUS.READY });
    } finally {
      this.isProcessing = false;
    }

    return job;
  }

  static async executeTestRun(job) {
    const startTime = Date.now();
    const project = await Project.findById(job.projectId);
    const website = await Website.findOne({ projectId: job.projectId });
    const mappings = await PageMapping.find({ projectId: job.projectId, enabled: true });

    if (!website || !website.previewUrl) {
      throw new Error('Project does not have an active website preview URL');
    }

    if (mappings.length === 0) {
      throw new Error('No enabled page mappings found to test');
    }

    // SSRF Check on website preview URL
    const urlValidation = validateSafeUrl(website.previewUrl, true);
    if (!urlValidation.isValid) {
      throw new Error(`Website URL rejected by SSRF guard: ${urlValidation.reason}`);
    }

    // Launch Chromium browser with resilient system binary discovery
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-animations',
      ],
    };

    // Use installed system Chrome or Edge if available
    const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const systemEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (fs.existsSync(systemChrome)) {
      launchOptions.executablePath = systemChrome;
    } else if (fs.existsSync(systemEdge)) {
      launchOptions.executablePath = systemEdge;
    }

    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: {
        width: job.viewportWidth || 1440,
        height: job.viewportHeight || 900,
      },
      deviceScaleFactor: 1,
    });

    const pageResults = [];
    let totalScoreSum = 0;
    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;

    try {
      const page = await context.newPage();

      // Disable CSS transitions/animations and caret blinking for deterministic captures
      await page.addInitScript(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
            caret-color: transparent !important;
          }
        `;
        document.head.appendChild(style);
      });

      for (const mapping of mappings) {
        const previewBase = website.previewUrl.endsWith('/') ? website.previewUrl : (website.previewUrl + '/');
        const cleanRoute = (mapping.websiteRoute || '').replace(/^\/+/, '');
        const targetUrl = new URL(cleanRoute, previewBase).toString();
        console.log(`[Worker] Visiting: ${targetUrl}`);

        await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
        // Wait for fonts and network settle
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
        });
        await page.waitForTimeout(600);

        // Take deterministic screenshot
        const screenshotBuffer = await page.screenshot({ fullPage: false });
        const screenshotFilename = `act_${job._id}_${mapping._id}_${Date.now()}.png`;
        const savedScreenshot = await StorageService.saveFile(
          'screenshots',
          screenshotFilename,
          screenshotBuffer
        );

        // Prepare reference image
        let refUrl = mapping.referenceImageUrl;
        if (!refUrl) {
          refUrl = await FigmaService.generateDemoReferenceImage(
            mapping.figmaNodeId,
            mapping.frameName || mapping.figmaPageName
          );
          mapping.referenceImageUrl = refUrl;
          await mapping.save();
        }

        // Get local path for reference image
        const refStorageKey = refUrl.split('/api/storage/')[1];
        let refBuffer;
        if (refStorageKey) {
          const refPath = StorageService.getFilePath(refStorageKey);
          if (refPath) {
            refBuffer = await fs.promises.readFile(refPath);
          }
        }
        if (!refBuffer) {
          // If reference was generated externally, fetch or regenerate
          refBuffer = await FigmaService.generateDemoReferenceImage(
            mapping.figmaNodeId,
            mapping.frameName
          );
          const savedRef = await StorageService.saveFile('references', `ref_${Date.now()}.png`, refBuffer);
          refUrl = savedRef.publicUrl;
        }

        // Run visual comparison engine
        const comparison = await VisualComparisonService.compare(refBuffer, screenshotBuffer, {
          targetWidth: mapping.viewportWidth || 1440,
          targetHeight: mapping.viewportHeight || 900,
        });

        totalScoreSum += comparison.matchPercentage;
        if (comparison.status === 'passed') passedCount++;
        else if (comparison.status === 'warning') warningCount++;
        else failedCount++;

        // Save PageResult
        const pageResult = await PageResult.create({
          testRunId: job._id,
          pageMappingId: mapping._id,
          pageName: mapping.figmaPageName || mapping.frameName,
          websiteRoute: mapping.websiteRoute,
          figmaReferenceUrl: refUrl,
          actualScreenshotUrl: savedScreenshot.publicUrl,
          diffScreenshotUrl: comparison.diffScreenshotUrl,
          matchPercentage: comparison.matchPercentage,
          diffPixelCount: comparison.diffPixels,
          totalPixelCount: comparison.totalPixels,
          differenceRegions: comparison.regions,
          status: comparison.status,
        });

        pageResults.push(pageResult);

        // Generate visual QA bug reports with Gemini
        if (comparison.regions.length > 0) {
          const aiIssues = await GeminiService.analyzeVisualDifferences({
            pageName: mapping.figmaPageName,
            route: mapping.websiteRoute,
            matchPercentage: comparison.matchPercentage,
            regions: comparison.regions,
            totalPixels: comparison.totalPixels,
            diffPixels: comparison.diffPixels,
          });

          // Match issues with region coordinates and update bugs (handling retest logic)
          for (let i = 0; i < comparison.regions.length; i++) {
            const reg = comparison.regions[i];
            const issue = aiIssues[i] || aiIssues[0] || {
              title: `Visual mismatch in ${mapping.figmaPageName}`,
              description: `Difference detected at (${reg.x}, ${reg.y})`,
              suggestedFix: 'Review element alignment and padding',
              severity: 'medium',
              category: 'layout',
              confidence: 0.85,
            };

            // Retest checking: see if this bug already existed in previous runs
            const existingBug = await Bug.findOne({
              projectId: job.projectId,
              pageName: mapping.figmaPageName,
              x: { $gte: reg.x - 40, $lte: reg.x + 40 },
              y: { $gte: reg.y - 40, $lte: reg.y + 40 },
            });

            if (existingBug) {
              if (existingBug.status === 'resolved') {
                // Bug returned! Mark as REGRESSED
                existingBug.status = 'regressed';
              }
              existingBug.pageResultId = pageResult._id;
              existingBug.width = reg.width;
              existingBug.height = reg.height;
              await existingBug.save();
            } else {
              // Create new bug
              await Bug.create({
                pageResultId: pageResult._id,
                projectId: job.projectId,
                title: issue.title,
                description: issue.description,
                pageName: mapping.figmaPageName,
                severity: issue.severity,
                category: issue.category,
                status: 'open',
                suggestedFix: issue.suggestedFix,
                confidence: issue.confidence,
                x: reg.x,
                y: reg.y,
                width: reg.width,
                height: reg.height,
              });
            }
          }
        } else {
          // If no differences detected on this page, any previous open bugs for this page are resolved!
          await Bug.updateMany(
            { projectId: job.projectId, pageName: mapping.figmaPageName, status: 'open' },
            { status: 'resolved', resolvedAt: new Date() }
          );
        }
      }
    } finally {
      await browser.close();
    }

    // Finalize TestRun statistics
    const avgScore = mappings.length > 0 ? Math.round(totalScoreSum / mappings.length) : 0;
    const durationMs = Date.now() - startTime;

    job.status = TEST_STATUS.COMPLETED;
    job.overallScore = avgScore;
    job.totalPages = mappings.length;
    job.passedPages = passedCount;
    job.warningPages = warningCount;
    job.failedPages = failedCount;
    job.durationMs = durationMs;
    job.completedAt = new Date();
    await job.save();

    await Project.findByIdAndUpdate(job.projectId, { status: PROJECT_STATUS.COMPLETED });

    console.log(`[Worker] Finished TestRun ${job._id}. Overall score: ${avgScore}%`);
    return job;
  }
}

