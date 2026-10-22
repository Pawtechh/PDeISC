const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log('=== TEST SUITE: BIOMETRIC HUELA DIGITAL & REAL QR RETIROS ===');

  // MOBILE CONTEXT (iPhone 14)
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });

  const page = await mobileCtx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. LOGIN AS CONSUMER
  console.log('1. Logging in as Consumer...');
  await page.getByText('Consumer', { exact: true }).click();
  await page.waitForTimeout(2500);

  // 2. CHECK CATALOG AND OPEN BOOKING MODAL
  console.log('2. Inspecting Catalog and Booking Modal...');
  const reserveBtn = page.getByText('Reservar', { exact: true }).first();
  if (await reserveBtn.count() > 0) {
    await reserveBtn.click();
    await page.waitForTimeout(1000);

    const modalReserveBtn = page.getByText('Reservar Tabla', { exact: true }).first();
    if (await modalReserveBtn.count() > 0) {
      await modalReserveBtn.click();
      await page.waitForTimeout(1500);

      // Scroll modal down
      await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        for (const d of divs) {
          if (d.scrollHeight > d.clientHeight && d.clientHeight > 300) {
            d.scrollTop = d.scrollHeight;
          }
        }
      });
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/verify_1_booking_biometric_box.png' });
      console.log('  -> Saved screenshots/verify_1_booking_biometric_box.png');

      // Click "Escanear Huella Digital para Firmar"
      const scanHuellaBtn = page.getByText('Escanear Huella Digital para Firmar', { exact: false }).first();
      if (await scanHuellaBtn.count() > 0) {
        console.log('  -> Clicking Escanear Huella Digital...');
        await scanHuellaBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'screenshots/verify_2_booking_biometric_signed.png' });
        console.log('  -> Saved screenshots/verify_2_booking_biometric_signed.png');
      }

      // Close modal
      const closeBtn = page.getByText('✕', { exact: true }).first();
      if (await closeBtn.count() > 0) await closeBtn.click();
      await page.waitForTimeout(800);
    }
  }

  // 3. MIS ALQUILERES & REAL QR PASS
  console.log('3. Inspecting Mis Alquileres and QR Pase de Retiro...');
  const myRentalsNav = page.getByText('Mis Alquileres', { exact: false }).first();
  if (await myRentalsNav.count() > 0) {
    await myRentalsNav.click();
    await page.waitForTimeout(2000);

    const verQrBtn = page.getByText('Ver QR', { exact: true }).first();
    if (await verQrBtn.count() > 0) {
      await verQrBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: 'screenshots/verify_3_my_rentals_real_qr_modal.png' });
      console.log('  -> Saved screenshots/verify_3_my_rentals_real_qr_modal.png');

      const closeQr = page.getByText('✕', { exact: true }).first();
      if (await closeQr.count() > 0) await closeQr.click();
      await page.waitForTimeout(800);
    } else {
      console.log('  (No active rental card with Ver QR button currently in Mis Alquileres)');
    }
  }

  // 4. AGENCY FLOW (QR Scanner & Biometric Signature in Delivery)
  console.log('4. Switching to Agency (Mostrador)...');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.getByText('Agencia', { exact: true }).click();
  await page.waitForTimeout(2500);

  // Navigate to Entregas tab
  const entregasTab = page.getByText('Entregas', { exact: false }).first();
  if (await entregasTab.count() > 0) {
    await entregasTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/verify_4_agency_deliveries_screen.png' });
    console.log('  -> Saved screenshots/verify_4_agency_deliveries_screen.png');

    // Click Escanear QR button
    const scanQrBtn = page.getByText('Escanear QR', { exact: false }).first();
    if (await scanQrBtn.count() > 0) {
      console.log('  -> Opening QR Camera Inspection Modal...');
      await scanQrBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/verify_5_agency_qr_scanner_modal.png' });
      console.log('  -> Saved screenshots/verify_5_agency_qr_scanner_modal.png');

      const closeScanner = page.getByText('Cerrar Escáner', { exact: false }).first();
      if (await closeScanner.count() > 0) await closeScanner.click();
      await page.waitForTimeout(800);
    }

    // Click Procesar Entrega
    const procBtn = page.getByText('Procesar Entrega', { exact: false }).first();
    if (await procBtn.count() > 0) {
      console.log('  -> Opening Procesar Entrega Checklist & Biometric Modal...');
      await procBtn.click();
      await page.waitForTimeout(1200);

      // Scroll modal down
      await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        for (const d of divs) {
          if (d.scrollHeight > d.clientHeight && d.clientHeight > 250) {
            d.scrollTop = d.scrollHeight;
          }
        }
      });
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/verify_6_agency_delivery_biometric_box.png' });
      console.log('  -> Saved screenshots/verify_6_agency_delivery_biometric_box.png');

      // Click Escanear Huella Digital
      const deliveryHuella = page.getByText('Escanear Huella Digital para Firmar', { exact: false }).first();
      if (await deliveryHuella.count() > 0) {
        console.log('  -> Signing Delivery with Huella Digital...');
        await deliveryHuella.click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: 'screenshots/verify_7_agency_delivery_signed.png' });
        console.log('  -> Saved screenshots/verify_7_agency_delivery_signed.png');
      }
    }
  }

  await browser.close();
  console.log('=== TEST SUITE COMPLETED SUCCESSFULLY ===');
}

run().catch(console.error);
