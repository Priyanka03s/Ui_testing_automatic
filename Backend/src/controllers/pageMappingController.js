import { PageMapping } from '../models/PageMapping.js';
import { Project } from '../models/Project.js';
import { FigmaConnection } from '../models/FigmaConnection.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createPageMapping = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    let { figmaNodeId, figmaPageName, frameName, websiteRoute, viewportWidth, viewportHeight, referenceImageUrl } = req.body;

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      return sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if (!websiteRoute) {
      websiteRoute = '/';
    }

    // Check duplicate route
    const duplicate = await PageMapping.findOne({ projectId, websiteRoute: websiteRoute.trim() });
    if (duplicate) {
      return sendError(res, `A mapping for website route "${websiteRoute}" already exists in this project`, 409, 'DUPLICATE_ROUTE');
    }

    // Auto-resolve figmaNodeId if empty or not provided
    if (!figmaNodeId || !figmaNodeId.trim()) {
      const figmaConn = await FigmaConnection.findOne({ projectId });
      if (figmaConn && figmaConn.importedPages?.length > 0) {
        for (const page of figmaConn.importedPages) {
          const matched = page.frames?.find(f => 
            f.name.toLowerCase() === (frameName || figmaPageName || '').toLowerCase()
          );
          if (matched) {
            figmaNodeId = matched.id;
            if (!figmaPageName) figmaPageName = page.name;
            if (!frameName) frameName = matched.name;
            if (!referenceImageUrl) referenceImageUrl = matched.imageUrl || '';
            break;
          }
        }
        if (!figmaNodeId && figmaConn.importedPages[0]?.frames?.length > 0) {
          const firstFrame = figmaConn.importedPages[0].frames[0];
          figmaNodeId = firstFrame.id;
          if (!figmaPageName) figmaPageName = figmaConn.importedPages[0].name;
          if (!frameName) frameName = firstFrame.name;
          if (!referenceImageUrl) referenceImageUrl = firstFrame.imageUrl || '';
        }
      }
      if (!figmaNodeId || !figmaNodeId.trim()) {
        figmaNodeId = '0:1';
      }
    }

    const mapping = await PageMapping.create({
      projectId,
      figmaNodeId: figmaNodeId || '0:1',
      figmaPageName: figmaPageName || 'Home',
      frameName: frameName || figmaPageName || 'Home Frame',
      websiteRoute: websiteRoute.trim(),
      viewportWidth: viewportWidth || 1440,
      viewportHeight: viewportHeight || 900,
      referenceImageUrl: referenceImageUrl || '',
      enabled: true,
    });

    return sendSuccess(res, { mapping }, 'Page mapping added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPageMappings = async (req, res, next) => {
  try {
    const mappings = await PageMapping.find({ projectId: req.params.id }).sort({ createdAt: 1 });
    return sendSuccess(res, { mappings });
  } catch (error) {
    next(error);
  }
};

export const updatePageMapping = async (req, res, next) => {
  try {
    const mapping = await PageMapping.findById(req.params.id);
    if (!mapping) {
      return sendError(res, 'Page mapping not found', 404, 'MAPPING_NOT_FOUND');
    }

    const { websiteRoute, viewportWidth, viewportHeight, enabled, referenceImageUrl } = req.body;

    if (websiteRoute) mapping.websiteRoute = websiteRoute.trim();
    if (viewportWidth) mapping.viewportWidth = viewportWidth;
    if (viewportHeight) mapping.viewportHeight = viewportHeight;
    if (enabled !== undefined) mapping.enabled = Boolean(enabled);
    if (referenceImageUrl) mapping.referenceImageUrl = referenceImageUrl;

    await mapping.save();
    return sendSuccess(res, { mapping }, 'Page mapping updated');
  } catch (error) {
    next(error);
  }
};

export const deletePageMapping = async (req, res, next) => {
  try {
    const mapping = await PageMapping.findByIdAndDelete(req.params.id);
    if (!mapping) {
      return sendError(res, 'Page mapping not found', 404, 'MAPPING_NOT_FOUND');
    }
    return sendSuccess(res, null, 'Page mapping removed');
  } catch (error) {
    next(error);
  }
};
