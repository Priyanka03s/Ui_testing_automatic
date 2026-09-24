import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateFixtures() {
  const dir = path.join(process.cwd(), 'tests', 'fixtures');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const width = 400;
  const height = 300;

  // Reference SVG
  const refSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0f172a" />
      <text x="30" y="50" font-family="sans-serif" font-size="20" fill="#ffffff">Header Title</text>
      <!-- CTA button in correct place -->
      <rect x="30" y="90" width="140" height="40" rx="6" fill="#3b82f6" />
      <text x="50" y="115" font-family="sans-serif" font-size="14" fill="#ffffff">Click Me</text>
    </svg>
  `;

  // Actual SVG with intentional 30px vertical offset on button
  const actSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0f172a" />
      <text x="30" y="50" font-family="sans-serif" font-size="20" fill="#ffffff">Header Title</text>
      <!-- CTA button shifted down by 30px -->
      <rect x="30" y="120" width="140" height="40" rx="6" fill="#3b82f6" />
      <text x="50" y="145" font-family="sans-serif" font-size="14" fill="#ffffff">Click Me</text>
    </svg>
  `;

  await sharp(Buffer.from(refSvg)).png().toFile(path.join(dir, 'reference.png'));
  await sharp(Buffer.from(actSvg)).png().toFile(path.join(dir, 'actual.png'));
  console.log('Test fixtures generated successfully');
}

generateFixtures().catch(console.error);
