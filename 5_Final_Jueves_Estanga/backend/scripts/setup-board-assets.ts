import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dir = path.resolve(__dirname, '../public/images/boards');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const imagesToDownload: Record<string, string> = {
  // Fish
  'fish-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/09/Riley-fish-Marlin2.jpg',
  'fish-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Surfboard_fins.jpg',

  // Shortboard
  'shortboard-1.jpg': 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=800',
  'shortboard-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Surfboard_rack.jpg',
  'shortboard-3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Surf_boards.jpg',
  'shortboard-4.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/WaikikiSurfboards.JPG',

  // Longboard
  'longboard-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Riley-longboard-classic2.jpg',
  'longboard-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Elevenfootersmall.jpg',
  'longboard-3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/95/%27Hot_curl%27_surfboard%2C_redwood_and_balsa_wood%2C_made_in_Hawaii.JPG',

  // Funboard
  'funboard-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Riley-MiniMal-Allrounder2.jpg',
  'funboard-2.jpg': 'https://images.unsplash.com/photo-1776347503185-f0c97da79fd1?w=800',
  'funboard-3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/WaikikiSurfboards.JPG',

  // SUP
  'sup-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/09/SUP_It_%26_Sea.jpg',
  'sup-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Lake_Annecy_%2815279372385%29.jpg',
  'sup-3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/43/J%C3%A9r%C3%A9my-Massi%C3%A8re_stand-up-paddle_biscarrosse-2.JPG',

  // Bodyboard
  'bodyboard-1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/David_%22Dubb%22_Hubbard_at_Waimea_Shorebreak.jpeg',
  'bodyboard-2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Boogie_Boarder_%2846304527995%29.jpg',
  'bodyboard-3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Bodyboarding_1_2007.jpg',
};

async function downloadAll() {
  console.log('📥 Descargando fotos auténticas de tablas de surf...');
  for (const [filename, url] of Object.entries(imagesToDownload)) {
    const dest = path.join(dir, filename);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'SurfRental/1.0' } });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(dest, buf);
          console.log(`✅ ${filename} (${buf.length} bytes)`);
        } else {
          console.warn(`⚠️ Error ${res.status} al descargar ${filename} desde ${url}`);
        }
      } catch (err: any) {
        console.error(`❌ Error en ${filename}:`, err.message);
      }
    } else {
      console.log(`⏩ ${filename} ya existe`);
    }
  }
}

// Mapeo específico por cada una de las 18 tablas
const BASE = 'http://localhost:3000/images/boards';

const boardPhotosMap: Record<string, string[]> = {
  // 1. Fish: Channel Islands FishBeard
  'board-seed-1': [`${BASE}/fish-1.jpg`, `${BASE}/fish-2.jpg`],

  // 2. Shortboard: Lost Driver 2.0
  'board-seed-2': [`${BASE}/shortboard-1.jpg`, `${BASE}/shortboard-2.jpg`],

  // 3. Longboard: Torq Classic Longboard 9'1
  'board-seed-3': [`${BASE}/longboard-1.jpg`, `${BASE}/longboard-2.jpg`],

  // 4. Funboard: UVA Retro Single Fin 7'2
  'board-seed-4': [`${BASE}/funboard-1.jpg`, `${BASE}/funboard-2.jpg`],

  // 5. Funboard: Catch Surf Odysea Skipper 6'0
  'board-seed-5': [`${BASE}/funboard-2.jpg`, `${BASE}/funboard-1.jpg`],

  // 6. SUP: Naish Mana All-Around SUP 10'0
  'board-seed-6': [`${BASE}/sup-1.jpg`, `${BASE}/sup-2.jpg`],

  // 7. Shortboard: Al Merrick Happy Everyday 5'10
  'board-seed-7': [`${BASE}/shortboard-2.jpg`, `${BASE}/shortboard-3.jpg`],

  // 8. Funboard: Firewire Sunday Rob Machado 6'4
  'board-seed-8': [`${BASE}/funboard-1.jpg`, `${BASE}/funboard-3.jpg`],

  // 9. Longboard: NSP Elements HDT Longboard 9'2
  'board-seed-9': [`${BASE}/longboard-2.jpg`, `${BASE}/longboard-1.jpg`],

  // 10. Shortboard: JS Industries Monsta Box 5'9
  'board-seed-10': [`${BASE}/shortboard-3.jpg`, `${BASE}/shortboard-1.jpg`],

  // 11. Bodyboard: Morey Mach 7 Pro Bodyboard 42"
  'board-seed-11': [`${BASE}/bodyboard-1.jpg`, `${BASE}/bodyboard-2.jpg`],

  // 12. SUP: Fanatic Fly Allwave SUP 9'6
  'board-seed-12': [`${BASE}/sup-2.jpg`, `${BASE}/sup-3.jpg`],

  // 13. Fish: DHD Phoenix Summer Twin 5'7
  'board-seed-13': [`${BASE}/fish-2.jpg`, `${BASE}/fish-1.jpg`],

  // 14. Shortboard: Pyzel Ghost John John Florence 6'1
  'board-seed-14': [`${BASE}/shortboard-4.jpg`, `${BASE}/shortboard-2.jpg`],

  // 15. Longboard: Bing Levitator Noserider 9'4
  'board-seed-15': [`${BASE}/longboard-3.jpg`, `${BASE}/longboard-1.jpg`],

  // 16. Funboard: Modern Highline Poly 6'8
  'board-seed-16': [`${BASE}/funboard-3.jpg`, `${BASE}/funboard-1.jpg`],

  // 17. Bodyboard: Hubboards Hubb Edition Quad Core 41.5"
  'board-seed-17': [`${BASE}/bodyboard-2.jpg`, `${BASE}/bodyboard-1.jpg`],

  // 18. SUP: Starboard Whopper SUP 10'0
  'board-seed-18': [`${BASE}/sup-3.jpg`, `${BASE}/sup-1.jpg`],
};

async function updateDatabase() {
  console.log('🔄 Actualizando base de datos MySQL con las fotos locales de cada tabla...');
  for (const [id, fotos] of Object.entries(boardPhotosMap)) {
    const updated = await prisma.board.update({
      where: { id },
      data: { fotos },
    }).catch(err => {
      console.warn(`Error al actualizar ${id}:`, err.message);
      return null;
    });
    if (updated) {
      console.log(`✅ [${updated.tipoTabla}] ${updated.titulo} -> ${fotos.join(', ')}`);
    }
  }
}

async function main() {
  await downloadAll();
  await updateDatabase();
  console.log('🎉 Listo: Todas las tablas configuradas con imágenes reales y locales.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
