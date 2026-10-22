import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.use({ viewport: { width: 1280, height: 1600 } });

test('Capturar vista previa de todas las 18 tablas', async ({ page }) => {
  const filePath = path.resolve('tests/preview-images.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'));
  await page.waitForTimeout(4000);

  const outPath = 'screenshots/all_18_boards_preview.png';
  await page.screenshot({ path: outPath, fullPage: true });

  const artifactDir = 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f';
  fs.copyFileSync(outPath, path.join(artifactDir, 'all_18_boards_preview.png'));
});
