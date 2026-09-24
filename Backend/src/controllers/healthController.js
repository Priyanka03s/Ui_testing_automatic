import { getDBStatus } from '../config/db.js';
import { GeminiService } from '../services/geminiService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getHealth = (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'DesignCheck AI API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export const getDbHealth = (req, res) => {
  const db = getDBStatus();
  return sendSuccess(res, {
    database: db,
    timestamp: new Date().toISOString(),
  });
};

export const getAiHealth = async (req, res) => {
  const aiHealth = await GeminiService.checkHealth();
  return sendSuccess(res, {
    ai: aiHealth,
    timestamp: new Date().toISOString(),
  });
};
