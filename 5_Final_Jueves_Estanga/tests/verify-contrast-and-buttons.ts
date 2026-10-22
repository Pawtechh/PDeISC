import { chromium } from 'playwright';

async function testContrastAndButtons() {
  const browser = await chromium.launch();

  // Mobile viewport
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Login as Consumer
  const consumerBtn = page.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  }
  await page.waitForTimeout(2000);

  // Capture Catalog view (Notice compact toggle and high visibility of surfboard cards)
  await page.screenshot({ path: 'screenshots/verify_01_catalog_compact_toggle.png' });

  // 2. Open QR Modal from My Rentals to verify high-contrast QR and code badge
  console.log('Navigating to Alquileres...');
  const rentalsTab = page.locator('text=Alquileres').first();
  await rentalsTab.click();
  await page.waitForTimeout(1500);

  const qrBtn = page.locator('text=Ver QR Retiro').first();
  if (await qrBtn.count() > 0) {
    await qrBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/verify_02_qr_modal_high_contrast.png' });
  }

  // 3. Desktop view to see arrows and carousel controls
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  const desktopConsumer = desktopPage.locator('text=Consumer').first();
  if (await desktopConsumer.count() > 0) {
    await desktopConsumer.click();
  }
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: 'screenshots/verify_03_desktop_carousel_with_arrows.png' });

  await browser.close();
  console.log('All verification screenshots captured!');
}

testContrastAndButtons().catch(console.error);
