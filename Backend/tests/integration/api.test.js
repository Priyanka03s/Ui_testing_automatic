import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('API Health and Security Tests', () => {
  it('GET /api/health should return 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('DesignCheck AI API');
  });

  it('GET /api/health/ai should return AI configuration status without exposing secrets', async () => {
    const res = await request(app).get('/api/health/ai');
    expect(res.status).toBe(200);
    expect(res.body.data.ai).toHaveProperty('configured');
    expect(res.body.data.ai).not.toHaveProperty('apiKey');
  });

  it('GET /api/admin/overview should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/register should validate registration input', async () => {
    const invalidRes = await request(app).post('/api/auth/register').send({
      name: 'P',
      email: 'not-an-email',
      password: '123',
      confirmPassword: '456',
    });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.code).toBe('VALIDATION_FAILED');
  });
});
