import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.use({ viewport: { width: 420, height: 950 } });

test.beforeAll(() => {
  try {
    execSync('npx prisma db seed', { cwd: './backend', stdio: 'ignore' });
  } catch (err) {
    console.warn('Seed reset in cancel test:', err);
  }
});

test('Flujo de Cancelación Escalonada de Alquiler (Bloque 1)', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  // 1. Abrir la app en Expo Web
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2500);

  // 2. Ingresar como Consumer
  const emailInput = page.getByTestId('login-input-email');
  if (await emailInput.isVisible()) {
    await emailInput.fill('consumer@surf.com');
    await page.getByTestId('login-input-password').fill('Password123!');
    await page.getByTestId('btn-login').click();
    await page.waitForTimeout(2500);
  } else {
    // Si ya está dentro, asegurarse de estar en vista Consumer
    const perfilTab = page.getByText('Perfil').first();
    if (await perfilTab.isVisible()) {
      await perfilTab.click();
      await page.waitForTimeout(800);
      const consumerBtn = page.getByText('Consumer').first();
      if (await consumerBtn.isVisible()) {
        await consumerBtn.click();
        await page.waitForTimeout(800);
      }
    }
  }

  // 3. Ir a la pestaña "Mis Alquileres"
  const rentalsTab = page.getByRole('tab', { name: /Mis Alquileres/i });
  await rentalsTab.click();
  await page.waitForTimeout(1500);

  // 4. Buscar botón "Cancelar"
  let cancelBtn = page.getByTestId('btn-cancelar-alquiler').first();
  const isCancelPresent = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
  if (!isCancelPresent) {
    // Si no hay alquiler activo cancelable, crear uno desde Catálogo
    const catalogTab = page.getByRole('tab', { name: /Catálogo/i });
    await catalogTab.click();
    await page.waitForTimeout(1500);
    const verDetalleBtn = page.getByRole('button', { name: /Ver Detalle/i }).or(page.getByText('Ver Detalle')).first();
    if (await verDetalleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verDetalleBtn.click();
      await page.waitForTimeout(1500);
      const btnReservar = page.getByTestId('btn-reservar-tabla');
      await btnReservar.scrollIntoViewIfNeeded();
      await btnReservar.click();
      await page.waitForTimeout(1500);

      // Abrir acordeón DEV y seleccionar tarjeta de prueba
      const toggleCardsBtn = page.getByTestId('btn-toggle-test-cards');
      if (await toggleCardsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggleCardsBtn.scrollIntoViewIfNeeded();
        await toggleCardsBtn.click();
        await page.waitForTimeout(500);
        const useVisaBtn = page.getByTestId('btn-use-card-visa');
        await useVisaBtn.click();
        await page.waitForTimeout(500);

        // Confirmar pago
        const btnPagar = page.getByTestId('checkout-btn-pagar');
        await btnPagar.scrollIntoViewIfNeeded();
        await btnPagar.click();
        await page.waitForTimeout(2500);

        // Ir a Mis Alquileres
        const btnIrAlquileres = page.getByTestId('btn-ir-a-alquileres');
        if (await btnIrAlquileres.isVisible({ timeout: 3000 }).catch(() => false)) {
          await btnIrAlquileres.click();
          await page.waitForTimeout(1500);
        }
      }
    }
    await rentalsTab.click();
    await page.waitForTimeout(1500);
  }

  cancelBtn = page.getByTestId('btn-cancelar-alquiler').first();
  await expect(cancelBtn).toBeVisible({ timeout: 5000 });
  await cancelBtn.click();
  await page.waitForTimeout(1000);

  // 5. Verificar modal abierto con la política escalonada
  const modalTitle = page.getByText('Cancelar Alquiler');
  await expect(modalTitle).toBeVisible();
  const refundPolicy = page.getByText('Política de Reembolso Escalonada');
  await expect(refundPolicy).toBeVisible();

  // Screenshot: modal abierto
  await page.screenshot({ path: 'screenshots/10_cancel_modal_open.png' });

  // 6. Apretar "Confirmar Cancelación"
  const confirmCancelBtn = page.getByTestId('btn-confirmar-cancelacion');
  await expect(confirmCancelBtn).toBeVisible();
  await confirmCancelBtn.click();
  await page.waitForTimeout(1500);

  // 7. Verificar que el modal se cerró inmediatamente y se muestra el banner de éxito
  await expect(modalTitle).not.toBeVisible();
  const successBanner = page.getByTestId('banner-cancelacion-exito');
  await expect(successBanner).toBeVisible();

  // Screenshot: alquiler cancelado con banner de éxito
  await page.screenshot({ path: 'screenshots/11_cancel_success_banner.png' });
});
