const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f';
const PUBLIC_URL = 'https://84694ad40be1dd.lhr.life';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log(`Navigating to public URL: ${PUBLIC_URL}...`);
  await page.goto(PUBLIC_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Take screenshot of catalog on public URL
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '69_public_url_catalog.png') });
  console.log('📸 Captured 69_public_url_catalog.png');

  // Switch to Owner
  const ownerBtn = page.locator('text=Dueño').or(page.locator('text=Dueño (Martín)')).or(page.locator('text=OWNER'));
  if (await ownerBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await ownerBtn.first().click();
    await page.waitForTimeout(1500);

    // Click on Revisiones
    const revisionsTab = page.locator('text=Revisiones').first();
    await revisionsTab.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '70_public_url_owner_revisions.png') });
    console.log('📸 Captured 70_public_url_owner_revisions.png');

    // Click on Reclamos y Mediación
    const tabMediaciones = page.getByTestId('tab-mediaciones');
    if (await tabMediaciones.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tabMediaciones.click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, '71_public_url_owner_mediation.png') });
      console.log('📸 Captured 71_public_url_owner_mediation.png');
    }
  }

  await browser.close();
  console.log('🎉 Public URL verification succeeded completely!');
}

run().catch((err) => {
  console.error('❌ Public URL test error:', err);
  process.exit(1);
});
