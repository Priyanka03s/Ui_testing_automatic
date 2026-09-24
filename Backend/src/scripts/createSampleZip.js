import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

function createSampleZip() {
  const dir = path.join(process.cwd(), 'tests', 'fixtures');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const zip = new AdmZip();

  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignCheck Sample Web Build</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: #f8fafc;
    }
    header {
      background: #111827;
      padding: 1.5rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1f2937;
    }
    .hero {
      padding: 5rem 3rem;
      max-width: 800px;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .hero p {
      color: #94a3b8;
      font-size: 1.25rem;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.85rem 1.75rem;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      padding: 2rem 3rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 1rem;
      border-radius: 12px;
    }
    .card-thumb {
      height: 150px;
      background: #334155;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <header>
    <div style="font-weight: 700; font-size: 1.25rem;">DesignCheck UI</div>
    <nav style="display: flex; gap: 2rem; font-size: 0.95rem; color: #94a3b8;">
      <span>Products</span>
      <span>Features</span>
      <span>Pricing</span>
    </nav>
  </header>
  <div class="hero">
    <h1>Figma Reference Design</h1>
    <p>Pixel-perfect automated validation platform connecting Figma to your live site.</p>
    <a href="#" class="btn">Get Started</a>
  </div>
  <div class="grid">
    <div class="card"><div class="card-thumb"></div><h3>Component One</h3><p>$49.00</p></div>
    <div class="card"><div class="card-thumb"></div><h3>Component Two</h3><p>$89.00</p></div>
    <div class="card"><div class="card-thumb"></div><h3>Component Three</h3><p>$129.00</p></div>
    <div class="card"><div class="card-thumb"></div><h3>Component Four</h3><p>$199.00</p></div>
  </div>
</body>
</html>`;

  zip.addFile('index.html', Buffer.from(sampleHtml, 'utf8'));
  zip.writeZip(path.join(dir, 'sample_website.zip'));
  console.log('sample_website.zip generated successfully in tests/fixtures/');
}

createSampleZip();
