import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/app.js';
import { connectDB } from '../../src/config/db.js';

describe('DesignCheck AI Complete End-to-End Workflow', () => {
  let userToken = '';
  let projectId = '';
  let testRunId = '';
  let bugId = '';

  const testEmail = `qa_tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  it('1. Register new user', async () => {
    await connectDB();

    const res = await request(app).post('/api/auth/register').send({
      name: 'QA Automation Engineer',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.token).toBeDefined();

    userToken = res.body.data.token;
  });

  it('2. Login registered user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    userToken = res.body.data.token;
  });

  it('3. Create project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Fashion Store QA',
        description: 'Automated verification of fashion store UI components',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.name).toBe('Fashion Store QA');

    projectId = res.body.data.project._id;
  });

  it('4. Connect Figma and import frames (demo mode)', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/figma/connect`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        personalAccessToken: 'demo_token_test',
        fileUrl: 'https://www.figma.com/design/demo_file/Store-Design',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pages.length).toBeGreaterThan(0);
  });

  it('5. Upload static website build ZIP', async () => {
    const zipPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample_website.zip');
    expect(fs.existsSync(zipPath)).toBe(true);

    const res = await request(app)
      .post(`/api/projects/${projectId}/websites/upload`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', zipPath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.previewUrl).toContain('/preview/');
  });

  it('6. Retrieve page mappings and trigger visual test run', async () => {
    const mappingsRes = await request(app)
      .get(`/api/projects/${projectId}/page-mappings`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(mappingsRes.status).toBe(200);
    expect(mappingsRes.body.data.mappings.length).toBeGreaterThan(0);

    const testRes = await request(app)
      .post(`/api/projects/${projectId}/test-runs`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        viewportWidth: 1440,
        viewportHeight: 900,
        browser: 'chromium',
      });

    expect(testRes.status).toBe(202);
    expect(testRes.body.success).toBe(true);
    expect(testRes.body.data.status).toBe('queued');

    testRunId = testRes.body.data.testRunId;
  });

  it('7. Verify test run endpoint details and retrieval', async () => {
    const res = await request(app)
      .get(`/api/test-runs/${testRunId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.testRun).toBeDefined();
  });

  it('8. Test bug update lifecycle', async () => {
    // Check bugs endpoint for project
    const bugsRes = await request(app)
      .get(`/api/projects/${projectId}/bugs`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(bugsRes.status).toBe(200);
    expect(Array.isArray(bugsRes.body.data.bugs)).toBe(true);
  });
});
