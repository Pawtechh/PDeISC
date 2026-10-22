import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 420, height: 950 } });

test('DatePicker y Validación Estricta en Registro (Bloque 2)', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  // 1. Abrir app
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2500);

  // Si está logueado como Consumer, desloguear o ir a registro
  const logoutBtn = page.getByTestId('btn-logout');
  if (await logoutBtn.isVisible()) {
    // Si estamos en otra pestaña, ir a Perfil primero si fuese necesario
    const perfilTab = page.getByText('Perfil').first();
    if (await perfilTab.isVisible()) {
      await perfilTab.click();
      await page.waitForTimeout(1000);
    }
    const btnCerrar = page.getByTestId('btn-logout');
    if (await btnCerrar.isVisible()) {
      await btnCerrar.click();
      await page.waitForTimeout(2000);
    }
  }

  // 2. Ir a Registro desde Login
  const irARegistro = page.getByText('Registrate acá').first();
  await expect(irARegistro).toBeVisible({ timeout: 5000 });
  await irARegistro.click();
  await page.waitForTimeout(1500);

  // 3. Probar validación estricta de nombres ("WW")
  const nombreInput = page.getByTestId('register-input-nombre');
  await expect(nombreInput).toBeVisible({ timeout: 5000 });
  await nombreInput.fill('WW');
  await page.getByTestId('register-input-apellido').click();
  await page.waitForTimeout(500);
  // Debe mostrar error de repetición absurda
  await expect(page.getByText('No puede consistir en caracteres repetidos')).toBeVisible();

  // Corregir nombre
  await nombreInput.fill('Santiago');
  await page.getByTestId('register-input-apellido').fill('González');

  // 4. Abrir DatePicker modal
  const datePickerInput = page.getByTestId('register-input-fechaNacimiento');
  await expect(datePickerInput).toBeVisible();
  await datePickerInput.click();
  await page.waitForTimeout(1000);

  // Verificar modal abierto
  const modalTitle = page.getByText('Fecha de Nacimiento').first();
  await expect(modalTitle).toBeVisible();

  // Screenshot 1: Calendario modal abierto
  await page.screenshot({ path: 'screenshots/12_datepicker_modal_open.png' });

  // 5. Probar fecha de menor de edad (< 18 años, ej: 2010)
  // Abrir selector de año
  const monthYearToggle = page.getByTestId('datepicker-month-year-toggle');
  await monthYearToggle.click();
  await page.waitForTimeout(500);

  const year2010 = page.getByTestId('datepicker-year-2010');
  await expect(year2010).toBeVisible();
  await year2010.click();
  await page.waitForTimeout(500);

  // Seleccionar día 15
  const day15 = page.getByTestId('datepicker-day-15');
  await day15.click();
  await page.waitForTimeout(500);

  // Confirmar menor de 18
  const confirmBtn = page.getByTestId('datepicker-btn-confirmar');
  await confirmBtn.click();
  await page.waitForTimeout(1000);

  // Screenshot 2: Error menor de 18
  await expect(page.getByText(/Debés ser mayor de 18 años|Menor de 18/)).toBeVisible();
  await page.screenshot({ path: 'screenshots/13_datepicker_under_18_error.png' });

  // 6. Probar fecha válida (+18 años, ej: 1998)
  await datePickerInput.click();
  await page.waitForTimeout(500);

  await monthYearToggle.click();
  await page.waitForTimeout(500);

  const year1998 = page.getByTestId('datepicker-year-1998');
  await expect(year1998).toBeVisible();
  await year1998.click();
  await page.waitForTimeout(500);

  await page.getByTestId('datepicker-day-15').click();
  await page.waitForTimeout(500);

  await confirmBtn.click();
  await page.waitForTimeout(1000);

  // Verificar fecha formateada y edad calculada
  await expect(page.getByText('15 de enero de 1998')).toBeVisible();
  await expect(page.getByText(/✓ Edad calculada: \d+ años/)).toBeVisible();

  // Screenshot 3: Fecha válida con edad
  await page.screenshot({ path: 'screenshots/14_datepicker_valid_selected_age.png' });
});
