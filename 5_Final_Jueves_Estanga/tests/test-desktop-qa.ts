import { chromium } from 'playwright';

async function testDesktop() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const consumerBtn = page.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  }
  await page.waitForTimeout(2000);

  // Desktop Carousel view
  await page.screenshot({ path: 'screenshots/audit_desktop_01_carousel.png' });

  // Desktop Grid view
  const gridToggle = page.locator('[data-testid="toggle-view-grid"]');
  await gridToggle.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/audit_desktop_02_grid.png' });

  await browser.close();
  console.log('Desktop screenshots captured successfully!');
}

testDesktop().catch(console.error);
