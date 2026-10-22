import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="circleClip">
      <circle cx="256" cy="256" r="236"/>
    </clipPath>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1118"/>
      <stop offset="60%" stop-color="#0F243A"/>
      <stop offset="100%" stop-color="#005B96"/>
    </linearGradient>
    <linearGradient id="sun" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFD166"/>
      <stop offset="100%" stop-color="#D4AF37"/>
    </linearGradient>
    <linearGradient id="waveFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00E5FF"/>
      <stop offset="100%" stop-color="#0077B6"/>
    </linearGradient>
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>

  <!-- Group clipped to circle -->
  <g clip-path="url(#circleClip)">
    <!-- Background -->
    <rect width="512" height="512" fill="url(#bg)"/>

    <!-- Golden Sunrise -->
    <circle cx="256" cy="180" r="75" fill="url(#sun)"/>

    <!-- Layer 3: Back Swell -->
    <path d="M 0 370 C 130 330, 200 280, 270 240 C 340 200, 400 190, 512 220 L 512 512 L 0 512 Z" fill="#003554" opacity="0.65"/>

    <!-- Layer 2: Mid Ocean Wave -->
    <path d="M 0 410 C 130 380, 190 320, 280 270 C 350 230, 420 225, 512 265 L 512 512 L 0 512 Z" fill="#005B96" opacity="0.85"/>

    <!-- Layer 1: Front Ocean Swell -->
    <path d="M 0 450 C 120 425, 200 375, 300 315 C 380 265, 435 265, 512 305 L 512 512 L 0 512 Z" fill="url(#waveFront)"/>

    <!-- Foam Lip Highlight -->
    <path d="M 200 375 C 250 345, 300 315, 380 265" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>

    <!-- Iconic Pure Surfboard in Center, Carving Gracefully -->
    <g transform="translate(256, 255) rotate(16)">
      <!-- Drop Shadow -->
      <path d="M 0 -130 C 32 -70, 40 40, 26 120 C 16 150, -16 150, -26 120 C -40 40, -32 -70, 0 -130 Z" fill="rgba(0,0,0,0.45)" transform="translate(6, 12)"/>
      <!-- Board Body -->
      <path d="M 0 -130 C 32 -70, 40 40, 26 120 C 16 150, -16 150, -26 120 C -40 40, -32 -70, 0 -130 Z" fill="url(#boardGrad)" stroke="#090C10" stroke-width="4"/>
      <!-- Center Racing Stripe -->
      <line x1="0" y1="-122" x2="0" y2="135" stroke="#0077B6" stroke-width="6" stroke-linecap="round"/>
      <line x1="-8" y1="-80" x2="-8" y2="105" stroke="#D4AF37" stroke-width="2.5"/>
      <line x1="8" y1="-80" x2="8" y2="105" stroke="#D4AF37" stroke-width="2.5"/>
    </g>
  </g>

  <!-- Outer Golden Champagne Border -->
  <circle cx="256" cy="256" r="238" fill="none" stroke="#D4AF37" stroke-width="14"/>
</svg>`;

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <style>
        body, html { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        svg { width: 512px; height: 512px; display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
  </html>`;

  await page.setContent(html);
  await page.waitForTimeout(300);

  const mobileAssetsDir = path.resolve(__dirname, '../mobile/assets');
  const mobileDistDir = path.resolve(__dirname, '../mobile/dist');

  // 1. 512x512 icon.png & adaptive-icon.png
  const buffer512 = await page.screenshot({ type: 'png', omitBackground: true });
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.png'), buffer512);
  fs.writeFileSync(path.join(mobileAssetsDir, 'adaptive-icon.png'), buffer512);

  // 2. 48x48 favicon.png
  await page.setViewportSize({ width: 48, height: 48 });
  await page.setContent(html.replace('512px', '48px').replace('512px', '48px'));
  await page.waitForTimeout(200);
  const buffer48 = await page.screenshot({ type: 'png', omitBackground: true });
  fs.writeFileSync(path.join(mobileAssetsDir, 'favicon.png'), buffer48);

  // Write directly to dist as well
  if (fs.existsSync(mobileDistDir)) {
    fs.writeFileSync(path.join(mobileDistDir, 'favicon.ico'), buffer48);
    fs.writeFileSync(path.join(mobileDistDir, 'favicon.png'), buffer48);
    fs.writeFileSync(path.join(mobileDistDir, 'favicon.svg'), svgContent);
  }

  fs.writeFileSync(path.join(mobileAssetsDir, 'favicon.svg'), svgContent);

  await browser.close();
  console.log('Perfect Clipped Surf Favicon successfully generated!');
}

generate().catch(console.error);
