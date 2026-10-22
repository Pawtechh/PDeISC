import http from 'http';
import fs from 'fs';
import { chromium } from 'playwright';

const boards = [
  { id: 'board-seed-1', tipo: 'Fish', name: "Channel Islands FishBeard 5'8", img: 'http://localhost:3000/images/boards/fish-1.jpg' },
  { id: 'board-seed-2', tipo: 'Shortboard', name: "Lost Driver 2.0 Pro", img: 'http://localhost:3000/images/boards/shortboard-1.jpg' },
  { id: 'board-seed-3', tipo: 'Longboard', name: "Torq Classic Longboard 9'1", img: 'http://localhost:3000/images/boards/longboard-1.jpg' },
  { id: 'board-seed-4', tipo: 'Funboard', name: "UVA Retro Single Fin 7'2", img: 'http://localhost:3000/images/boards/funboard-1.jpg' },
  { id: 'board-seed-5', tipo: 'Funboard', name: "Catch Surf Odysea Skipper 6'0", img: 'http://localhost:3000/images/boards/funboard-2.jpg' },
  { id: 'board-seed-6', tipo: 'SUP', name: "Naish Mana All-Around SUP 10'0", img: 'http://localhost:3000/images/boards/sup-1.jpg' },
  { id: 'board-seed-7', tipo: 'Shortboard', name: "Al Merrick Happy Everyday 5'10", img: 'http://localhost:3000/images/boards/shortboard-2.jpg' },
  { id: 'board-seed-8', tipo: 'Funboard', name: "Firewire Sunday Rob Machado 6'4", img: 'http://localhost:3000/images/boards/funboard-1.jpg' },
  { id: 'board-seed-9', tipo: 'Longboard', name: "NSP Elements HDT Longboard 9'2", img: 'http://localhost:3000/images/boards/longboard-2.jpg' },
  { id: 'board-seed-10', tipo: 'Shortboard', name: "JS Industries Monsta Box 5'9", img: 'http://localhost:3000/images/boards/shortboard-3.jpg' },
  { id: 'board-seed-11', tipo: 'Bodyboard', name: "Morey Mach 7 Pro 42\"", img: 'http://localhost:3000/images/boards/bodyboard-1.jpg' },
  { id: 'board-seed-12', tipo: 'SUP', name: "Fanatic Fly Allwave SUP 9'6", img: 'http://localhost:3000/images/boards/sup-2.jpg' },
  { id: 'board-seed-13', tipo: 'Fish', name: "DHD Phoenix Summer Twin 5'7", img: 'http://localhost:3000/images/boards/fish-2.jpg' },
  { id: 'board-seed-14', tipo: 'Shortboard', name: "Pyzel Ghost JJF 6'1", img: 'http://localhost:3000/images/boards/shortboard-4.jpg' },
  { id: 'board-seed-15', tipo: 'Longboard', name: "Bing Levitator Noserider 9'4", img: 'http://localhost:3000/images/boards/longboard-3.jpg' },
  { id: 'board-seed-16', tipo: 'Funboard', name: "Modern Highline Poly 6'8", img: 'http://localhost:3000/images/boards/funboard-3.jpg' },
  { id: 'board-seed-17', tipo: 'Bodyboard', name: "Hubboards Hubb Edition 41.5\"", img: 'http://localhost:3000/images/boards/bodyboard-2.jpg' },
  { id: 'board-seed-18', tipo: 'SUP', name: "Starboard Whopper SUP 10'0", img: 'http://localhost:3000/images/boards/sup-3.jpg' },
];

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: white; padding: 24px; margin: 0; }
    h1 { margin-bottom: 20px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .card { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    .card img { width: 100%; height: 210px; object-fit: contain; background: #020617; display: block; }
    .content { padding: 12px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; background: #0284c7; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
    .title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>🏄‍♂️ Verificación de Imágenes Reales de Tablas por Modelo y Tipo</h1>
  <div class="grid">
    ${boards.map(b => `
      <div class="card">
        <img src="${b.img}" />
        <div class="content">
          <span class="badge">${b.tipo}</span>
          <div class="title">${b.name}</div>
          <div class="sub">${b.id}</div>
        </div>
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

server.listen(3007, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1800 } });
  await page.goto('http://localhost:3007');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/all_18_boards_verified.png', fullPage: true });
  fs.copyFileSync('screenshots/all_18_boards_verified.png', 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f/all_18_boards_verified.png');
  await browser.close();
  server.close();
  console.log('✅ Screenshot all_18_boards_verified.png generado.');
});
