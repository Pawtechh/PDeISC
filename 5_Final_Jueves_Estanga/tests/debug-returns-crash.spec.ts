import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(30000);

test('Depurar crash en pestaña Devoluciones', async ({ page }) => {
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

  // Seleccionar rol Agencia desde pantalla inicial
  console.log('Haciendo click en Agencia...');
  const agenciaBtn = page.getByText('Agencia').first();
  await expect(agenciaBtn).toBeVisible({ timeout: 5000 });
  await agenciaBtn.click();
  await page.waitForTimeout(2000);

  // Click en pestaña "Devoluciones"
  console.log('Haciendo click en pestaña Devoluciones...');
  const devolucionesTab = page.getByText('Devoluciones').first();
  await expect(devolucionesTab).toBeVisible({ timeout: 5000 });
  await devolucionesTab.click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'screenshots/debug_devoluciones_screen.png' });
  console.log('Captura tomada en screenshots/debug_devoluciones_screen.png');
  console.log('Total errores detectados:', errors.length);
});
