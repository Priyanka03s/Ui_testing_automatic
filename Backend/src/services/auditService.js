import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  actorUserId,
  action,
  resourceType,
  resourceId = '',
  metadata = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    // Sanitize metadata to never store passwords or tokens
    const cleanMeta = { ...metadata };
    delete cleanMeta.password;
    delete cleanMeta.passwordHash;
    delete cleanMeta.token;
    delete cleanMeta.accessToken;
    delete cleanMeta.credentials;

    await AuditLog.create({
      actorUserId,
      action,
      resourceType,
      resourceId,
      metadata: cleanMeta,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error(`[Audit Log Failed] ${err.message}`);
  }
};
