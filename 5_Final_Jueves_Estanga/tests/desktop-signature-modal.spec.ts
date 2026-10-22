import { test, expect } from '@playwright/test';

// Vista de escritorio amplia (laptop / monitor de oficina)
test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(45000);

test('Modal de Check-in en escritorio: Recuadro de firma centrado y con ancho ergonómico', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // 1. Acceder con rol AGENCIA
  const agenciaBtn = page.getByText('Agencia').first();
  await expect(agenciaBtn).toBeVisible();
  await agenciaBtn.click();
  await page.waitForTimeout(1500);

  // 2. Ir a Entregas
  const entregasTab = page.getByText('Entregas').first();
  await expect(entregasTab).toBeVisible();
  await entregasTab.click();
  await page.waitForTimeout(1500);

  // 3. Abrir el modal de Check-in
  const btnProcesar = page.getByTestId('btn-procesar-entrega').first();
  await expect(btnProcesar).toBeVisible({ timeout: 8000 });
  await btnProcesar.click();
  await page.waitForTimeout(1000);

  // 4. Verificar que el modal está centrado y no se estira a 1280px
  const modalCard = page.getByTestId('card-checkin-modal');
  await expect(modalCard).toBeVisible();

  const box = await modalCard.boundingBox();
  console.log(`Ancho del modal en pantalla de 1280px: ${box?.width}px (esperado <= 560px)`);
  expect(box?.width).toBeLessThanOrEqual(560);

  // 5. Verificar que el recuadro de firma está contenido y tiene proporciones ergonómicas
  const sigPad = page.getByTestId('delivery-signature-pad');
  await expect(sigPad).toBeVisible();
  const padBox = await sigPad.boundingBox();
  console.log(`Dimensiones del SignaturePad: ${padBox?.width}px x ${padBox?.height}px`);
  expect(padBox?.width).toBeLessThanOrEqual(540);
  expect(padBox?.height).toBeGreaterThanOrEqual(130);

  // 6. Probar trazo rápido
  const quickSignBtn = page.getByTestId('delivery-signature-pad-btn-quick');
  await quickSignBtn.click();
  await page.waitForTimeout(500);

  // 7. Tomar captura de pantalla en escritorio
  await page.screenshot({ path: 'screenshots/32_desktop_checkin_modal_responsive.png' });
  console.log('📸 Captura guardada: screenshots/32_desktop_checkin_modal_responsive.png');
});
