const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log('=== VERIFYING AGENCY DELIVERIES: QR CAMERA & BIOMETRICS ===');

  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });

  const page = await mobileCtx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Quick login as Agencia
  await page.getByText('Agencia', { exact: true }).click({ force: true });
  await page.waitForTimeout(2000);

  // Navigate to Entregas tab
  const entregasTab = page.getByText('Entregas', { exact: false }).first();
  await entregasTab.click({ force: true });
  await page.waitForTimeout(1500);

  // 1. Check Escanear QR button
  const scanQrBtn = page.locator('[data-testid="btn-scan-qr-delivery"]');
  console.log('Found Escanear QR button:', await scanQrBtn.count() > 0);
  await scanQrBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/verify_5_agency_qr_scanner_modal.png' });
  console.log('Saved screenshots/verify_5_agency_qr_scanner_modal.png');

  // Close scanner modal using testID
  const closeScanner = page.locator('[data-testid="btn-close-camera-scanner"]');
  if (await closeScanner.count() > 0) {
    await closeScanner.click();
    await page.waitForTimeout(1000);
  }

  // 2. Open "Procesar Entrega"
  const procBtn = page.locator('[data-testid="btn-procesar-entrega"]').first();
  console.log('Found Procesar Entrega button:', await procBtn.count() > 0);
  if (await procBtn.count() > 0) {
    await procBtn.click();
    await page.waitForTimeout(1200);

    // Scroll modal down
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      for (const d of divs) {
        if (d.scrollHeight > d.clientHeight && d.clientHeight > 200) {
          d.scrollTop = d.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/verify_6_agency_delivery_biometric_box.png' });
    console.log('Saved screenshots/verify_6_agency_delivery_biometric_box.png');

    // Click Escanear Huella Digital
    const deliveryHuella = page.locator('[data-testid="btn-scan-biometric-fingerprint"]').first();
    if (await deliveryHuella.count() > 0) {
      await deliveryHuella.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: 'screenshots/verify_7_agency_delivery_signed.png' });
      console.log('Saved screenshots/verify_7_agency_delivery_signed.png');
    }

    // Switch to Firma Manuscrita tab
    const padTab = page.locator('[data-testid="tab-sign-pad"]');
    if (await padTab.count() > 0) {
      await padTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'screenshots/verify_8_agency_signature_pad_tab.png' });
      console.log('Saved screenshots/verify_8_agency_signature_pad_tab.png');
    }
  }

  await browser.close();
  console.log('=== COMPLETED SUCCESSFULLY ===');
}

run().catch(console.error);
