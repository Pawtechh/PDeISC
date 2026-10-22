import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(60000);

const ARTIFACT_DIR = 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f';

test('Verificación visual de imágenes respectivas para cada tipo de tabla de surf en Catálogo MDP', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // 1. Acceder como Consumer
  const consumerBtn = page.getByText('Consumer').first();
  await consumerBtn.click();
  await page.waitForTimeout(1500);

  // 2. Ir a Catálogo
  const catalogTab = page.getByText('Catálogo').first();
  await expect(catalogTab).toBeVisible();
  await catalogTab.click();
  await page.waitForTimeout(2000);

  // 3. Captura general del catálogo (vista principal)
  const screenshot1 = 'screenshots/33_catalog_board_specific_photos.png';
  await page.screenshot({ path: screenshot1 });
  if (fs.existsSync(screenshot1)) {
    fs.copyFileSync(screenshot1, path.join(ARTIFACT_DIR, '33_catalog_board_specific_photos.png'));
  }

  // 4. Filtrar por Fish (tablas retro twin-fin con cola de pez)
  const fishFilter = page.getByTestId('catalog-filter-Fish');
  if (await fishFilter.isVisible()) {
    await fishFilter.click();
    await page.waitForTimeout(1500);
    const screenshotFish = 'screenshots/34_catalog_fish_boards.png';
    await page.screenshot({ path: screenshotFish });
    if (fs.existsSync(screenshotFish)) {
      fs.copyFileSync(screenshotFish, path.join(ARTIFACT_DIR, '34_catalog_fish_boards.png'));
    }
  }

  // 5. Filtrar por Longboard (tablas clásicas de 9+ pies)
  const longboardFilter = page.getByTestId('catalog-filter-Longboard');
  if (await longboardFilter.isVisible()) {
    await longboardFilter.click();
    await page.waitForTimeout(1500);
    const screenshotLongboard = 'screenshots/35_catalog_longboard_boards.png';
    await page.screenshot({ path: screenshotLongboard });
    if (fs.existsSync(screenshotLongboard)) {
      fs.copyFileSync(screenshotLongboard, path.join(ARTIFACT_DIR, '35_catalog_longboard_boards.png'));
    }
  }

  // 6. Filtrar por SUP (Stand Up Paddleboards)
  const supFilter = page.getByTestId('catalog-filter-SUP');
  if (await supFilter.isVisible()) {
    await supFilter.click();
    await page.waitForTimeout(1500);
    const screenshotSup = 'screenshots/36_catalog_sup_boards.png';
    await page.screenshot({ path: screenshotSup });
    if (fs.existsSync(screenshotSup)) {
      fs.copyFileSync(screenshotSup, path.join(ARTIFACT_DIR, '36_catalog_sup_boards.png'));
    }
  }

  // 7. Filtrar por Shortboard (tablas de alto rendimiento / thrusters)
  const shortboardFilter = page.getByTestId('catalog-filter-Shortboard');
  if (await shortboardFilter.isVisible()) {
    await shortboardFilter.click();
    await page.waitForTimeout(1500);
    const screenshotShort = 'screenshots/37_catalog_shortboards.png';
    await page.screenshot({ path: screenshotShort });
    if (fs.existsSync(screenshotShort)) {
      fs.copyFileSync(screenshotShort, path.join(ARTIFACT_DIR, '37_catalog_shortboards.png'));
    }
  }

  // 8. Abrir 'Ver Detalle' de una tabla de surf para inspeccionar la galería de fotos
  const verDetalleBtn = page.getByText('Ver Detalle').first();
  await expect(verDetalleBtn).toBeVisible({ timeout: 5000 });
  await verDetalleBtn.click();
  await page.waitForTimeout(1500);

  const screenshotDetail = 'screenshots/38_board_detail_gallery.png';
  await page.screenshot({ path: screenshotDetail });
  if (fs.existsSync(screenshotDetail)) {
    fs.copyFileSync(screenshotDetail, path.join(ARTIFACT_DIR, '38_board_detail_gallery.png'));
  }

  console.log('✅ Verificación visual completa.');
});
