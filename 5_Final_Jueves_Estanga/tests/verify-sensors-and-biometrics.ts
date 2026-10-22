import { chromium } from 'playwright';

async function verifySensorsAndBiometrics() {
  const browser = await chromium.launch({ headless: true });

  // 1. Vista Agencia: Mapa Google, Inspección QR y Biometría
  console.log('1. Probando vista Agencia (Sensórica, Mapa y QR)...');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const page = await desktopCtx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click en Mostrador / Agencia
  const agencyBtn = page.locator('text=Agencia').first();
  if (await agencyBtn.count() > 0) {
    await agencyBtn.click();
    await page.waitForTimeout(2000);
  }

  // Scroll hacia la sección de sensórica
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const d of allDivs) {
      if (d.scrollHeight > d.clientHeight && d.clientHeight > 300) {
        d.scrollTop = d.scrollHeight;
      }
    }
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'screenshots/1_agency_sensors_with_google_map.png', fullPage: false });
  console.log('Captura 1 guardada: screenshots/1_agency_sensors_with_google_map.png');

  // Probar botón "Abrir Cámara y Escanear QR"
  const qrBtn = page.locator('text=Abrir Cámara y Escanear QR').first();
  if (await qrBtn.count() > 0) {
    await qrBtn.click();
    await page.waitForTimeout(1000);

    // Click en botón de prueba QR: FishBeard 5'8
    const testQrPill = page.locator('text=FishBeard 5\'8').first();
    if (await testQrPill.count() > 0) {
      await testQrPill.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/2_qr_inspection_scanned_result.png' });
    console.log('Captura 2 guardada: screenshots/2_qr_inspection_scanned_result.png');

    // Cerrar modal
    const closeBtn = page.locator('text=✕').last();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 2. Probar Vista Mobile en Teléfono (Firma con Huella Digital en Reserva)
  console.log('2. Probando vista Teléfono Móvil (Huella Digital en Reserva)...');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Click en Consumer
  const consumerBtn = mobilePage.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
    await mobilePage.waitForTimeout(2000);
  }

  // Abrir modal de reserva ("Reservar")
  const reserveBtn = mobilePage.locator('text=Reservar').first();
  if (await reserveBtn.count() > 0) {
    await reserveBtn.click();
    await mobilePage.waitForTimeout(1000);

    // Scroll hasta la sección de firma por huella digital
    await mobilePage.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const d of allDivs) {
        if (d.scrollHeight > d.clientHeight && d.clientHeight > 300) {
          d.scrollTop = d.scrollHeight;
        }
      }
    });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({ path: 'screenshots/3_mobile_phone_biometric_signature_view.png' });
    console.log('Captura 3 guardada: screenshots/3_mobile_phone_biometric_signature_view.png');

    // Click en botón de huella "Escanear Huella Digital para Firmar"
    const bioScanBtn = mobilePage.locator('text=Escanear Huella Digital para Firmar').first();
    if (await bioScanBtn.count() > 0) {
      await bioScanBtn.click();
      await mobilePage.waitForTimeout(1200);

      await mobilePage.screenshot({ path: 'screenshots/4_mobile_phone_biometric_signature_signed.png' });
      console.log('Captura 4 guardada: screenshots/4_mobile_phone_biometric_signature_signed.png');
    }
  }

  await browser.close();
  console.log('Verificación completada exitosamente.');
}

verifySensorsAndBiometrics().catch(console.error);
