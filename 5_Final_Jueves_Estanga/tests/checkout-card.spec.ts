import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 420, height: 950 } });

test('Flujo Completo de Checkout con Validación Luhn, Accordion DEV, Time Slots y Diagnóstico de Botón', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  // 1. Abrir app
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2500);

  // 2. Si está en Login, loguear como Consumer con credenciales reales
  const emailInput = page.getByTestId('login-input-email');
  if (await emailInput.isVisible()) {
    await emailInput.fill('consumer@surf.com');
    await page.getByTestId('login-input-password').fill('Password123!');
    await page.getByTestId('btn-login').click();
    await page.waitForTimeout(2500);
  } else {
    // Si hay un botón dev Consumer visible
    const consumerDevBtn = page.getByText('Consumer', { exact: true });
    if (await consumerDevBtn.isVisible()) {
      await consumerDevBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // 3. Ir a la pestaña "Catálogo"
  const catalogTab = page.getByText('Catálogo').first();
  await catalogTab.click();
  await page.waitForTimeout(1500);

  // 4. Seleccionar "Ver Detalle" en la primera tabla del catálogo
  const verDetalleBtn = page.getByText('Ver Detalle').first();
  await expect(verDetalleBtn).toBeVisible({ timeout: 5000 });
  await verDetalleBtn.click();
  await page.waitForTimeout(1500);

  // 5. En el detalle de la tabla, apretar "Reservar Tabla"
  const btnReservar = page.getByTestId('btn-reservar-tabla');
  await btnReservar.scrollIntoViewIfNeeded();
  await expect(btnReservar).toBeVisible({ timeout: 5000 });
  await btnReservar.click();
  await page.waitForTimeout(1500);

  // 6. Verificar que abrió CheckoutScreen con el resumen y secciones
  await expect(page.getByTestId('checkout-title')).toBeVisible();
  await expect(page.getByTestId('checkout-board-summary')).toBeVisible();
  await expect(page.getByTestId('checkout-schedule-card')).toBeVisible();
  await expect(page.getByTestId('checkout-price-breakdown')).toBeVisible();

  // Screenshot 15: Resumen inicial de checkout
  await page.screenshot({ path: 'screenshots/15_checkout_summary.png' });

  // 7. DIAGNÓSTICO DEL BOTÓN DESHABILITADO (Bloque 1)
  // Ingresar número que NO pasa Luhn ("4520 0151 1283 0366") reportado por el usuario
  const cardInput = page.getByTestId('checkout-input-card-number');
  await cardInput.scrollIntoViewIfNeeded();
  await cardInput.fill('4520015112830366');
  await cardInput.blur();
  await page.waitForTimeout(300);

  // Completar el resto de los campos correctamente
  await page.getByTestId('checkout-input-card-name').fill('LUCAS PERALTA');
  await page.getByTestId('checkout-input-card-exp').fill('1228');
  await page.getByTestId('checkout-input-card-cvv').fill('123');
  await page.getByTestId('checkout-input-card-dni').fill('38123456');
  await page.waitForTimeout(500);

  // Verificar feedback de error bajo el input
  const feedbackCard = page.getByTestId('feedback-card-number');
  await expect(feedbackCard).toContainText('Número inválido');

  // Verificar panel de validación detallando el error
  const validationPanel = page.getByTestId('checkout-validation-panel');
  await validationPanel.scrollIntoViewIfNeeded();
  await expect(validationPanel).toContainText('Estado de Validación');
  await expect(validationPanel).toContainText('Número inválido. Revisá que esté bien escrito');

  // Intentar tocar el botón de pago deshabilitado para disparar el feedback / banner
  const btnPagarContainer = page.getByTestId('checkout-btn-pagar-touchable');
  await btnPagarContainer.click();
  await page.waitForTimeout(500);

  // Verificar que apareció el banner superior de error explicativo
  const bannerError = page.getByTestId('banner-error-checkout');
  await expect(bannerError).toBeVisible();

  // Screenshot 19: Panel de validación y feedback con error de Luhn
  await page.screenshot({ path: 'screenshots/19_checkout_validation_panel_errors.png' });

  // 8. VERIFICAR MODAL DE DEBUG (Bloque 1.5)
  const debugBtn = page.getByTestId('btn-checkout-debug');
  await debugBtn.click();
  await page.waitForTimeout(500);
  await expect(page.getByText('Debug Estado del Formulario')).toBeVisible();
  // Cerrar modal de debug
  await page.getByText('Cerrar Debug').click();
  await page.waitForTimeout(500);

  // 9. PROBAR ACCORDION DE TARJETAS DE PRUEBA (Bloque 2)
  const toggleCardsBtn = page.getByTestId('btn-toggle-test-cards');
  await toggleCardsBtn.scrollIntoViewIfNeeded();
  await toggleCardsBtn.click();
  await page.waitForTimeout(500);

  // Screenshot 20: Accordion desplegado con tarjetas de sandbox válidas
  await page.screenshot({ path: 'screenshots/20_checkout_test_cards_accordion.png' });

  // Click en "Usar" para Visa (4509 9535 6623 3704)
  const useVisaBtn = page.getByTestId('btn-use-card-visa');
  await useVisaBtn.click();
  await page.waitForTimeout(500);

  // Verificar que el campo de tarjeta ahora es válido y marca VISA
  const brandBadge = page.getByTestId('checkout-brand-badge');
  await expect(brandBadge).toHaveText('VISA');
  await expect(feedbackCard).toContainText('Válido');

  // Screenshot 16: Marca VISA detectada y datos válidos
  await page.screenshot({ path: 'screenshots/16_checkout_card_brand_detected.png' });

  // 10. VERIFICAR TIME SLOTS DINÁMICOS (Bloque 3)
  const scheduleCard = page.getByTestId('checkout-schedule-card');
  await scheduleCard.scrollIntoViewIfNeeded();
  await expect(scheduleCard).toBeVisible();

  // Screenshot 21: Selector de slots dinámicos con chips de horarios
  await page.screenshot({ path: 'screenshots/21_checkout_dynamic_time_slots.png' });

  // 11. CONFIRMAR PAGO HABILITADO (Bloque 4)
  await validationPanel.scrollIntoViewIfNeeded();
  await expect(validationPanel).toContainText('7 de 7 completados');
  await expect(validationPanel).toContainText('Todo Listo para Confirmar');

  const btnPagar = page.getByTestId('checkout-btn-pagar');
  await btnPagar.scrollIntoViewIfNeeded();
  await expect(btnPagar).toBeEnabled();
  await btnPagar.click();

  // Screenshot 17: Spinner de procesamiento
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/17_checkout_processing_spinner.png' });

  // 12. ESPERAR RESOLUCIÓN Y VERIFICAR COMPROBANTE FINAL
  await page.waitForTimeout(2500);
  await expect(page.getByTestId('checkout-success-card')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('¡Reserva y Pago Confirmados!')).toBeVisible();
  await expect(page.getByText('PAGO SIMULADO — MODO DEV')).toBeVisible();
  await expect(page.getByText(/•••• 3704 \(VISA\)/)).toBeVisible();
  await expect(page.getByText('Pre-autorizada ($50.000 ARS)')).toBeVisible();

  // Screenshot 22: Confirmación final de reserva y pago
  await page.screenshot({ path: 'screenshots/22_checkout_final_success.png' });
});
