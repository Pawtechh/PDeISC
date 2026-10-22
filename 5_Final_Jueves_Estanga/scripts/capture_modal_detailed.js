const { chromium } = require('playwright');
const path = require('path');

async function captureModal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  const brainDir = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f';

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Login como Agencia
  await page.locator('text=Agencia').last().click();
  await page.waitForTimeout(2000);

  // Clic en tab Devoluciones
  await page.locator('text=Devoluciones').first().click();
  await page.waitForTimeout(2000);

  // Clic en Registrar Devolución del primer elemento
  await page.locator('text=Registrar Devolución').first().click();
  await page.waitForTimeout(1000);

  // Clic en checklist de daño: "¿Presenta fisuras, golpes o roturas?"
  await page.locator('text=¿Presenta fisuras, golpes o roturas?').click();
  await page.waitForTimeout(1000);

  // Llenar descripción alfanumérica de prueba
  const descInput = page.locator('input[placeholder*="Golpe en el tail"]').or(page.locator('textarea[placeholder*="Golpe"]')).or(page.locator('input[placeholder*="proa"]'));
  if (await descInput.count() > 0) {
    await descInput.first().fill('Golpe de 4cm en el deck con quilla izquierda fisurada');
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(brainDir, '51_damage_modal_detailed.png') });
  console.log('Captura modal de daño guardada en 51_damage_modal_detailed.png');

  await browser.close();
}

captureModal().catch(console.error);
