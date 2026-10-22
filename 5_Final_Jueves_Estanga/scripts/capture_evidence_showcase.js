const { chromium } = require('playwright');
const path = require('path');

async function captureEvidence() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });

  const brainDir = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f';

  // 1. Hosted Web Manual
  console.log('Capturando manual web...');
  await page.goto('http://localhost:3000/manual', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, '46_hosted_manual_web.png') });

  // 2. Profile screen with theme toggle & manual links
  console.log('Navegando a la App...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click tab Perfil
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div, span, button'));
    const perfilTab = tabs.find(el => el.textContent && el.textContent.trim() === 'Perfil');
    if (perfilTab) perfilTab.click();
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(brainDir, '43_profile_and_manual_links.png') });

  // 3. Click Modo Oscuro
  console.log('Activando Modo Oscuro...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div, button'));
    const darkBtn = buttons.find(el => el.textContent && el.textContent.includes('Modo Oscuro'));
    if (darkBtn) darkBtn.click();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(brainDir, '44_dark_mode_active.png') });

  // 4. Modal de Devolución con daño y foto
  console.log('Cambiando a rol Agencia para capturar modal de daño...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div, button'));
    const agenciaBtn = buttons.find(el => el.textContent && el.textContent.trim() === 'Agencia');
    if (agenciaBtn) agenciaBtn.click();
  });
  await page.waitForTimeout(2000);

  // Click en pestaña Devoluciones
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div, span, button'));
    const devTab = tabs.find(el => el.textContent && el.textContent.trim() === 'Devoluciones');
    if (devTab) devTab.click();
  });
  await page.waitForTimeout(2000);

  // Click en "Registrar Devolución"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div, button'));
    const retBtn = btns.find(el => el.textContent && el.textContent.includes('Registrar Devolución'));
    if (retBtn) retBtn.click();
  });
  await page.waitForTimeout(1000);

  // Togle daño
  await page.evaluate(() => {
    const checks = Array.from(document.querySelectorAll('div'));
    const damageCheck = checks.find(el => el.textContent && el.textContent.includes('¿Presenta fisuras, golpes'));
    if (damageCheck) damageCheck.click();
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(brainDir, '45_damage_modal_with_photo.png') });

  await browser.close();
  console.log('Capturas de evidencia finalizadas exitosamente!');
}

captureEvidence().catch(err => {
  console.error('Error en captura:', err);
  process.exit(1);
});
