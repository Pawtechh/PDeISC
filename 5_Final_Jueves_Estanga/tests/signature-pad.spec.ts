import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Verificación y Funcionamiento Integral del Recuadro de Firma Digital (Ley 25.506)', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // 1. Iniciar sesión como Agencia
  const agenciaBtn = page.getByText('Agencia').first();
  await agenciaBtn.click();
  await page.waitForTimeout(1500);

  // 2. Navegar a UI Primitives
  const uiPrimitivesTab = page.getByText('UI Primitives').first();
  await expect(uiPrimitivesTab).toBeVisible();
  await uiPrimitivesTab.click();
  await page.waitForTimeout(1000);

  // 3. Ubicar el recuadro de firma
  const signaturePad = page.getByTestId('showcase-signature-pad');
  await expect(signaturePad).toBeVisible();

  // Scroll down to the signature pad
  await signaturePad.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // 4. Verificar estado inicial: Pendiente de firma
  const statusEl = page.getByTestId('showcase-signature-pad-status');
  await expect(statusEl).toContainText('Pendiente de firma');
  await page.screenshot({ path: 'screenshots/22_signature_pad_initial_placeholder.png' });

  // 5. Testear "Firma Rápida" (Quick sign)
  const quickSignBtn = page.getByTestId('showcase-signature-pad-btn-quick');
  await expect(quickSignBtn).toBeVisible();
  await quickSignBtn.click();
  await page.waitForTimeout(500);

  // Verificar que el estado cambió a registrado
  await expect(statusEl).toContainText('Firma registrada');
  await page.screenshot({ path: 'screenshots/23_signature_pad_signed.png' });

  // 6. Testear "Borrar firma"
  const clearBtn = page.getByTestId('showcase-signature-pad-btn-clear');
  await expect(clearBtn).toBeVisible();
  await clearBtn.click();
  await page.waitForTimeout(500);

  // Verificar que volvió a pendiente
  await expect(statusEl).toContainText('Pendiente de firma');

  // 7. Testear dibujo táctil/mouse directo en el recuadro
  const padBox = page.getByTestId('showcase-signature-pad-box');
  const boxBounds = await padBox.boundingBox();
  expect(boxBounds).not.toBeNull();

  if (boxBounds) {
    const startX = boxBounds.x + 40;
    const startY = boxBounds.y + boxBounds.height / 2;
    const endX = boxBounds.x + boxBounds.width - 40;
    const endY = startY - 20;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 60, startY + 30, { steps: 5 });
    await page.mouse.move(startX + 120, startY - 25, { steps: 5 });
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }

  // Verificar que el trazo dibujado activó el estado firmado
  await expect(statusEl).toContainText('Firma registrada');
  await page.screenshot({ path: 'screenshots/24_signature_pad_custom_drawing.png' });

  // 8. Navegar a la pestaña "Entregas" para verificar el flujo de Check-in con firma
  const entregasTab = page.getByText('Entregas').first();
  await entregasTab.click();
  await page.waitForTimeout(1200);

  const procesarEntregaBtn = page.getByTestId('btn-procesar-entrega').first();
  if (await procesarEntregaBtn.isVisible()) {
    await procesarEntregaBtn.click();
    await page.waitForTimeout(800);

    // Verificar modal abierto con el pad de firma del mostrador
    const deliveryModal = page.getByTestId('card-checkin-modal');
    await expect(deliveryModal).toBeVisible();

    const deliveryPad = page.getByTestId('delivery-signature-pad');
    await expect(deliveryPad).toBeVisible();

    // Firmar con firma rápida
    const deliveryQuickBtn = page.getByTestId('delivery-signature-pad-btn-quick');
    await deliveryQuickBtn.click();
    await page.waitForTimeout(500);

    const deliveryStatus = page.getByTestId('delivery-signature-pad-status');
    await expect(deliveryStatus).toContainText('Firma registrada');

    await page.screenshot({ path: 'screenshots/25_delivery_checkin_signed.png' });
  }
});
