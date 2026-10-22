import http from 'http';
import fs from 'fs';
import { chromium } from 'playwright';

const boards = [
  {
    tipo: 'Fish',
    name: 'Fish Surfboard (Riley Marlin Twin Fin)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Riley-fish-Marlin2.jpg'
  },
  {
    tipo: 'Longboard',
    name: 'Longboard Classic (Riley Classic Noserider)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Riley-longboard-classic2.jpg'
  },
  {
    tipo: 'Funboard',
    name: 'Funboard Mini-Mal (Riley Allrounder 7ft)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Riley-MiniMal-Allrounder2.jpg'
  },
  {
    tipo: 'Shortboard',
    name: 'Shortboards Performance (Concaves & Thruster)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Surfboardbottoms.jpg'
  },
  {
    tipo: 'SUP',
    name: 'Stand Up Paddle (SUP It & Sea)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/0/09/SUP_It_%26_Sea.jpg'
  },
  {
    tipo: 'Bodyboard',
    name: 'Bodyboard / Boogie Board (Waimea Shorebreak)',
    img: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/David_%22Dubb%22_Hubbard_at_Waimea_Shorebreak.jpeg'
  },
  {
    tipo: 'Rental Rack',
    name: 'Waikiki Rental Surfboard Lineup',
    img: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/WaikikiSurfboards.JPG'
  }
];

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background: #0f172a; color: white; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .card { background: #1e293b; border-radius: 8px; overflow: hidden; padding: 10px; }
    .card img { width: 100%; height: 220px; object-fit: contain; background: #020617; border-radius: 6px; }
    .title { font-weight: bold; margin-top: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #0284c7; font-size: 12px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Comprobación Visual de Fotos Reales de Tablas (Wikipedia Commons)</h1>
  <div class="grid">
    ${boards.map(b => `
      <div class="card">
        <span class="badge">${b.tipo}</span>
        <img src="${b.img}" />
        <div class="title">${b.name}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(3006, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('http://localhost:3006');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'screenshots/wikimedia_boards_preview.png' });
  fs.copyFileSync('screenshots/wikimedia_boards_preview.png', 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f/wikimedia_boards_preview.png');
  await browser.close();
  server.close();
  console.log('✅ Generado wikimedia_boards_preview.png');
});
