import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Probar Owner Revisiones y Consumer Mis Alquileres para detectar crash', async ({ page }) => {
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

  // 1. Probar Dueño -> Revisiones
  console.log('Ingresando como Dueño...');
  await page.getByText('Dueño').first().click();
  await page.waitForTimeout(1500);

  console.log('Click en Revisiones...');
  const revisionesTab = page.getByText('Revisiones').first();
  await expect(revisionesTab).toBeVisible();
  await revisionesTab.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/owner_revisiones_screen.png' });

  // 2. Probar Perfil -> Cambiar a Consumer
  console.log('Cambiando a Consumer...');
  await page.getByText('Perfil').first().click();
  await page.waitForTimeout(1000);
  await page.getByText('Consumer').first().click();
  await page.waitForTimeout(1500);

  console.log('Click en Mis Alquileres...');
  await page.getByText('Mis Alquileres').first().click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/consumer_mis_alquileres_screen.png' });

  console.log('Errores encontrados:', errors);
  expect(errors.length).toBe(0);
});
