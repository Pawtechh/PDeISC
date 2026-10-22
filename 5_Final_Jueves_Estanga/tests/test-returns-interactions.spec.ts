import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(40000);

test('Probar interacciones en Devoluciones y detectar posibles crashes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR (UNCAUGHT EXCEPTION):', err.message, err.stack);
    errors.push(err.message);
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // Click Agencia
  await page.getByText('Agencia').first().click();
  await page.waitForTimeout(1500);

  // Click Devoluciones
  await page.getByText('Devoluciones').first().click();
  await page.waitForTimeout(1500);

  // Si hay botón "Registrar Devolución", clickearlo
  const btnDevolucion = page.getByText('Registrar Devolución').first();
  if (await btnDevolucion.isVisible()) {
    console.log('Click en Registrar Devolución...');
    await btnDevolucion.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/devolucion_modal_open.png' });

    // Click en "¿Presenta fisuras, golpes o roturas?"
    console.log('Click en checkbox de daño...');
    await page.getByText('2. ¿Presenta fisuras, golpes o roturas?').click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/devolucion_modal_damage_checked.png' });

    // Intentar escribir texto en el input de daño
    const inputDanio = page.getByPlaceholder('Ej: Golpe en el tail, quilla central astillada...');
    if (await inputDanio.isVisible()) {
      console.log('Escribiendo descripción de daño...');
      await inputDanio.fill('Golpe fuerte en canto lateral izquierdo con grieta de 5cm');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'screenshots/devolucion_modal_with_text.png' });
  } else {
    console.log('No había tablas con botón Registrar Devolución');
  }

  console.log('Errores detectados en la prueba:', errors);
  expect(errors.length).toBe(0);
});
