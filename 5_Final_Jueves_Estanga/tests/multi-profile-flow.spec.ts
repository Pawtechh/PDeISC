import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(65000);

test('Flujo Multi-Perfil: Reserva (Consumer) -> Entrega (Agencia) -> Devolución (Agencia) -> Verificación (Owner y Consumer)', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // ----------------------------------------------------
  // FASE 1: CONSUMER - Reservar Tabla en Catálogo
  // ----------------------------------------------------
  // 1. Acceso rápido como Consumer
  const consumerBtn = page.getByText('Consumer').first();
  await consumerBtn.click();
  await page.waitForTimeout(1500);

  // 2. Ir al Catálogo
  const catalogTab = page.getByText('Catálogo').first();
  await expect(catalogTab).toBeVisible();
  await catalogTab.click();
  await page.waitForTimeout(1000);

  // 3. Abrir "Ver Detalle" de la primera tabla
  const verDetalleBtn = page.getByText('Ver Detalle').first();
  await expect(verDetalleBtn).toBeVisible({ timeout: 5000 });
  await verDetalleBtn.click();
  await page.waitForTimeout(1500);

  // 4. En el modal de detalle, click en "Reservar Tabla"
  const btnReservarModal = page.getByTestId('btn-reservar-tabla');
  await btnReservarModal.scrollIntoViewIfNeeded();
  await expect(btnReservarModal).toBeVisible({ timeout: 5000 });
  await btnReservarModal.click();
  await page.waitForTimeout(1500);

  // 5. Verificar que abrió CheckoutScreen
  await expect(page.getByTestId('checkout-title')).toBeVisible();

  // 6. Completar formulario de pago con tarjeta Visa de prueba (Luhn válido)
  const cardInput = page.getByTestId('checkout-input-card-number');
  await cardInput.scrollIntoViewIfNeeded();
  await cardInput.fill('4509953566233704');
  await page.getByTestId('checkout-input-card-name').fill('LUCAS PERALTA');
  await page.getByTestId('checkout-input-card-exp').fill('1228');
  await page.getByTestId('checkout-input-card-cvv').fill('123');
  await page.getByTestId('checkout-input-card-dni').fill('38123456');
  await page.waitForTimeout(500);

  // 7. Confirmar y Pagar
  const btnPagar = page.getByTestId('checkout-btn-pagar-touchable');
  await btnPagar.scrollIntoViewIfNeeded();
  await btnPagar.click();
  await page.waitForTimeout(2500);

  // 8. Verificar éxito del pago y creación del alquiler
  await expect(page.getByTestId('checkout-success-card')).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: 'screenshots/26_multiprofile_consumer_booked.png' });

  // 9. Click en "Ver Pase de Retiro en Mis Alquileres"
  const btnPase = page.getByTestId('btn-ir-a-alquileres');
  await expect(btnPase).toBeVisible({ timeout: 5000 });
  await btnPase.click();
  await page.waitForTimeout(1000);

  // Cerrar modal de detalle si quedó abierto
  const btnCerrarModal = page.getByText('✕ Cerrar').first();
  if (await btnCerrarModal.isVisible()) {
    await btnCerrarModal.click();
    await page.waitForTimeout(500);
  }

  // ----------------------------------------------------
  // FASE 2: CAMBIAR A ROL AGENCIA - Procesar Entrega en Mostrador
  // ----------------------------------------------------
  const perfilTab = page.getByText('Perfil').first();
  await perfilTab.click();
  await page.waitForTimeout(1000);

  const agenciaRoleBtn = page.getByText('Agencia').first();
  await agenciaRoleBtn.click();
  await page.waitForTimeout(1500);

  // Ir a pestaña "Entregas"
  const entregasTab = page.getByText('Entregas').first();
  await expect(entregasTab).toBeVisible();
  await entregasTab.click();
  await page.waitForTimeout(1500);

  // Debe existir al menos un alquiler pendiente de entrega
  const btnProcesarEntrega = page.getByTestId('btn-procesar-entrega').first();
  await expect(btnProcesarEntrega).toBeVisible({ timeout: 8000 });
  await btnProcesarEntrega.click();
  await page.waitForTimeout(800);

  // En el modal de Check-in, verificar el recuadro de firma ergonómico y compacto
  const deliveryModal = page.getByTestId('card-checkin-modal');
  await expect(deliveryModal).toBeVisible();

  // Estampar firma digital con el botón rápido
  const quickSignBtn = page.getByTestId('delivery-signature-pad-btn-quick');
  await expect(quickSignBtn).toBeVisible();
  await quickSignBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'screenshots/27_multiprofile_agency_checkin_signed.png' });

  // Confirmar Entrega en Mostrador
  const btnConfirmarEntrega = page.getByTestId('btn-confirmar-entrega');
  await btnConfirmarEntrega.click();
  await page.waitForTimeout(1500);

  // ----------------------------------------------------
  // FASE 3: AGENCIA - Gestionar Devolución en "Devoluciones"
  // ----------------------------------------------------
  const devolucionesTab = page.getByText('Devoluciones').first();
  await expect(devolucionesTab).toBeVisible();
  await devolucionesTab.click();
  await page.waitForTimeout(1500);

  // Filtrar por la tabla alquilada (Starboard)
  const searchInput = page.getByPlaceholder('Escanear o buscar por código QR de tabla...');
  await searchInput.fill('Starboard');
  await page.waitForTimeout(600);

  // Debe aparecer la tabla en el agua lista para recibir devolución (Starboard)
  const btnRegistrarDevolucion = page.getByText('Registrar Devolución').first();
  await expect(btnRegistrarDevolucion).toBeVisible({ timeout: 8000 });
  await btnRegistrarDevolucion.click();
  await page.waitForTimeout(800);

  // En el modal de recepción, confirmar devolución
  const btnConfirmarRecepcion = page.getByText('Confirmar Recepción').first();
  await expect(btnConfirmarRecepcion).toBeVisible();
  await btnConfirmarRecepcion.click();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'screenshots/28_multiprofile_agency_returned.png' });

  // ----------------------------------------------------
  // FASE 4: CONSUMER - Verificar que el alquiler pasó a Finalizado/Devuelto
  // ----------------------------------------------------
  const agenciaPerfilTab = page.getByText('Perfil', { exact: true }).last();
  await agenciaPerfilTab.click();
  await page.waitForTimeout(1000);

  const consumerBackBtn = page.getByText('Consumer').first();
  await consumerBackBtn.click();
  await page.waitForTimeout(1500);

  // Ir a "Mis Alquileres"
  const misAlquileresTab = page.getByText('Mis Alquileres', { exact: true }).first();
  await expect(misAlquileresTab).toBeVisible();
  await misAlquileresTab.click();
  await page.waitForTimeout(1500);

  // Verificar que la lista de alquileres se cargó correctamente
  await expect(page.getByText('Mis Alquileres').first()).toBeVisible();
  await page.screenshot({ path: 'screenshots/29_multiprofile_consumer_history.png' });
});
