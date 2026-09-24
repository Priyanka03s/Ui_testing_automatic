import { describe, it, expect } from 'vitest';
import { validateSafeUrl, isPrivateOrInternalIP } from '../../src/utils/safeUrlValidator.js';
import { encryptToken, decryptToken } from '../../src/utils/crypto.js';

describe('Security & SSRF Guard', () => {
  it('should identify private and internal IPs correctly', () => {
    expect(isPrivateOrInternalIP('127.0.0.1')).toBe(true);
    expect(isPrivateOrInternalIP('10.0.0.5')).toBe(true);
    expect(isPrivateOrInternalIP('172.16.0.1')).toBe(true);
    expect(isPrivateOrInternalIP('192.168.1.1')).toBe(true);
    expect(isPrivateOrInternalIP('169.254.169.254')).toBe(true); // AWS/GCP metadata
    expect(isPrivateOrInternalIP('::1')).toBe(true);

    expect(isPrivateOrInternalIP('8.8.8.8')).toBe(false);
    expect(isPrivateOrInternalIP('104.21.50.1')).toBe(false);
  });

  it('should reject unsafe URLs trying to access localhost or metadata endpoints', () => {
    expect(validateSafeUrl('http://169.254.169.254/latest/meta-data/').isValid).toBe(false);
    expect(validateSafeUrl('http://127.0.0.1:8080/admin').isValid).toBe(false);
    expect(validateSafeUrl('http://localhost:3000/internal').isValid).toBe(false);
    expect(validateSafeUrl('ftp://example.com/test').isValid).toBe(false); // Disallow non-HTTP
  });

  it('should encrypt and decrypt tokens accurately using AES-256-GCM', () => {
    const rawToken = 'figd_ABC123_xyz987_secret_personal_access_token';
    const encrypted = encryptToken(rawToken);

    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('data');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted.data).not.toBe(rawToken);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(rawToken);
  });
});
