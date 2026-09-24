import crypto from 'crypto';
import { ENV } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

const getKey = () => {
  let keyHex = ENV.FIGMA_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    keyHex = crypto.createHash('sha256').update(keyHex || 'fallback-key').digest('hex');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
};

export const encryptToken = (plainText) => {
  if (!plainText) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: tag.toString('hex'),
  };
};

export const decryptToken = (encryptedObj) => {
  if (!encryptedObj || !encryptedObj.data || !encryptedObj.iv || !encryptedObj.tag) {
    return null;
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(encryptedObj.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));

  let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
