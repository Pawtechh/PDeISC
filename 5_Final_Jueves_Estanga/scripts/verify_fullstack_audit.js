const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Take screenshot of Login screen
  await page.screenshot({ path: path.join(screenshotDir, 'audit_01_login_screen.png') });
  console.log('Saved audit_01_login_screen.png');

  // Click Consumer button
  console.log('Logging in as Consumer...');
  const consumerBtn = page.getByText('Consumer', { exact: true });
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(screenshotDir, 'audit_02_consumer_catalog.png') });
    console.log('Saved audit_02_consumer_catalog.png');
  }

  // Logout or navigate to Agencia
  console.log('Logging in as Agencia...');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const agenciaBtn = page.getByText('Agencia', { exact: true });
  if (await agenciaBtn.count() > 0) {
    await agenciaBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(screenshotDir, 'audit_03_agency_sensors.png') });
    console.log('Saved audit_03_agency_sensors.png');
  }

  await browser.close();
  console.log('Playwright audit verification complete!');
})();
