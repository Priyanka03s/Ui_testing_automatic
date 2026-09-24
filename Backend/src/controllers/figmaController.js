import { FigmaConnection } from '../models/FigmaConnection.js';
import { Project } from '../models/Project.js';
import { PageMapping } from '../models/PageMapping.js';
import { FigmaService } from '../services/figmaService.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/auditService.js';

export const connectFigma = async (req, res, next) => {
  try {
    const { personalAccessToken, fileUrl } = req.body;
    const projectId = req.params.id;

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const fileKey = FigmaService.extractFileKey(fileUrl);
    if (!fileKey) {
      return sendError(res, 'Invalid Figma file URL or file key format', 400, 'INVALID_FIGMA_URL');
    }

    // Validate token with Figma
    await FigmaService.validateToken(personalAccessToken);

    // Fetch file document to import pages and frames
    const fileDoc = await FigmaService.getFile(personalAccessToken, fileKey);
    const parsedPages = FigmaService.parsePagesAndFrames(fileDoc);

    // Encrypt personal access token
    const encryptedToken = encryptToken(personalAccessToken);

    let connection = await FigmaConnection.findOne({ projectId });
    if (connection) {
      connection.fileKey = fileKey;
      connection.fileName = fileDoc.name || 'Figma Design';
      connection.encryptedAccessToken = encryptedToken;
      connection.importedPages = parsedPages;
      connection.lastSyncedAt = new Date();
      await connection.save();
    } else {
      connection = await FigmaConnection.create({
        userId: req.user._id,
        projectId,
        fileKey,
        fileName: fileDoc.name || 'Figma Design',
        encryptedAccessToken: encryptedToken,
        importedPages: parsedPages,
      });
    }

    // Auto-create initial page mappings for discovered frames if none exist
    const existingMappings = await PageMapping.countDocuments({ projectId });
    if (existingMappings === 0 && parsedPages.length > 0) {
      const defaultRoutes = ['/', '/products', '/product-details', '/cart', '/checkout'];
      let routeIndex = 0;

      for (const page of parsedPages) {
        for (const frame of page.frames) {
          if (routeIndex < defaultRoutes.length) {
            // Generate/store reference image
            const refImgUrl = await FigmaService.fetchAndStoreReferenceImage(
              personalAccessToken,
              fileKey,
              frame.id,
              frame.name
            );

            await PageMapping.create({
              projectId,
              figmaNodeId: frame.id,
              figmaPageName: page.name,
              frameName: frame.name,
              websiteRoute: defaultRoutes[routeIndex],
              viewportWidth: frame.width || 1440,
              viewportHeight: frame.height || 900,
              referenceImageUrl: refImgUrl,
            });
            routeIndex++;
          }
        }
      }
    }

    await logAudit({
      actorUserId: req.user._id,
      action: 'figma.connect',
      resourceType: 'FigmaConnection',
      resourceId: connection._id.toString(),
      metadata: { fileKey, fileName: fileDoc.name, pagesCount: parsedPages.length },
      req,
    });

    return sendSuccess(
      res,
      {
        connection: connection.toJSON(),
        pages: parsedPages,
      },
      'Figma connected and design frames imported successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getFigmaConnection = async (req, res, next) => {
  try {
    const connection = await FigmaConnection.findOne({ projectId: req.params.id });
    if (!connection) {
      return sendSuccess(res, { connection: null });
    }
    return sendSuccess(res, { connection: connection.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const importFigmaFrames = async (req, res, next) => {
  try {
    const connection = await FigmaConnection.findOne({ projectId: req.params.id });
    if (!connection) {
      return sendError(res, 'Figma connection not found for this project', 404, 'NO_FIGMA_CONNECTION');
    }

    const token = decryptToken(connection.encryptedAccessToken);
    if (!token) {
      return sendError(res, 'Unable to decrypt Figma token', 500, 'DECRYPTION_FAILED');
    }

    const fileDoc = await FigmaService.getFile(token, connection.fileKey);
    const parsedPages = FigmaService.parsePagesAndFrames(fileDoc);

    connection.importedPages = parsedPages;
    connection.lastSyncedAt = new Date();
    await connection.save();

    return sendSuccess(res, { pages: parsedPages }, 'Figma frames refreshed successfully');
  } catch (error) {
    next(error);
  }
};
