const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Switch to Owner role if needed
  const ownerSwitchBtn = page.locator('text=Dueño').or(page.locator('text=OWNER')).or(page.locator('text=Dueño (Martín)'));
  if (await ownerSwitchBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await ownerSwitchBtn.first().click();
    await page.waitForTimeout(1000);
  }

  // Navigate to Revisiones tab
  console.log('Navigating to Revisiones tab...');
  const revisionsTab = page.locator('text=Revisiones').first();
  await revisionsTab.click();
  await page.waitForTimeout(2000);

  // Verify Segment tabs are present
  const tabInspecciones = page.getByTestId('tab-inspecciones');
  const tabMediaciones = page.getByTestId('tab-mediaciones');

  await tabInspecciones.waitFor({ state: 'visible', timeout: 5000 });
  await tabMediaciones.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Both segmented tabs are visible');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '67_revisions_with_tabs.png') });
  console.log('📸 Captured 67_revisions_with_tabs.png');

  // Click on "Reclamos y Mediación" tab
  console.log('Switching to Reclamos y Mediación tab...');
  await tabMediaciones.click();
  await page.waitForTimeout(1500);

  // Verify Protocol Banner is visible
  const protocolText = page.locator('text=PROTOCOLO TRIPARTITO DE GARANTÍA Y MEDIACIÓN').first();
  await protocolText.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Tripartite mediation protocol banner is visible');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '68_owner_claims_mediation_tab.png'), fullPage: true });
  console.log('📸 Captured 68_owner_claims_mediation_tab.png');

  // Verify that claim cards with live tracking are displayed
  const caseBadge = page.locator('text=CASO #').first();
  await caseBadge.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Owner claims are rendered with live tracking');

  await browser.close();
  console.log('🎉 MEDIATION TRACKING VERIFICATION SUCCEEDED!');
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
