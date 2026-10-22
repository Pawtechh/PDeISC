const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log('=== VERIFYING REAL QR CODE RENDERING ===');

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Agency login
  await page.getByText('Agencia', { exact: true }).click({ force: true });
  await page.waitForTimeout(2000);

  // Go to Entregas
  const entregasTab = page.getByText('Entregas', { exact: false }).first();
  await entregasTab.click({ force: true });
  await page.waitForTimeout(1500);

  // Click "Ver QR" on the first rental card
  const verQrBtn = page.getByText('Ver QR', { exact: true }).first();
  console.log('Found Ver QR button:', await verQrBtn.count() > 0);
  if (await verQrBtn.count() > 0) {
    await verQrBtn.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/verify_real_qr_modal.png' });
    console.log('Saved screenshots/verify_real_qr_modal.png');
  }

  await browser.close();
  console.log('=== VERIFICATION COMPLETED ===');
}

run().catch(console.error);
