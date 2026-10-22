import { chromium } from 'playwright';

async function verifyCheckoutBiometric() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const consumerBtn = page.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
    await page.waitForTimeout(2000);
  }

  // Click on "Reservar" on first board
  const reserveBtn = page.locator('text=Reservar').first();
  if (await reserveBtn.count() > 0) {
    await reserveBtn.click();
    await page.waitForTimeout(1000);
  }

  // Click on "Reservar Tabla" in BoardDetailScreen
  const modalReserveBtn = page.locator('text=Reservar Tabla').first();
  if (await modalReserveBtn.count() > 0) {
    await modalReserveBtn.click();
    await page.waitForTimeout(1500);
  }

  // Scroll to bottom of CheckoutScreen to see the Biometric Signature Box
  await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const d of allDivs) {
      if (d.scrollHeight > d.clientHeight && d.clientHeight > 300) {
        d.scrollTop = d.scrollHeight * 0.85;
      }
    }
  });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/checkout_biometric_box_mobile.png' });
  console.log('Saved screenshots/checkout_biometric_box_mobile.png');

  // Click on "Escanear Huella Digital para Firmar"
  const scanBtn = page.locator('text=Escanear Huella Digital para Firmar').first();
  if (await scanBtn.count() > 0) {
    await scanBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/checkout_biometric_signed_mobile.png' });
    console.log('Saved screenshots/checkout_biometric_signed_mobile.png');
  }

  await browser.close();
}

verifyCheckoutBiometric().catch(console.error);
