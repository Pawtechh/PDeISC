import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Flujo de Login, Navegacion entre Roles y Logout', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/01_login_screen.png' });

  // 1. Acceso rápido como Consumer
  const consumerBtn = page.getByText('Consumer').first();
  await consumerBtn.click();
  await page.waitForTimeout(1500);

  // Navegar a Perfil
  const perfilTab = page.getByText('Perfil').first();
  if (await perfilTab.isVisible()) {
    await perfilTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'screenshots/02_consumer_logged.png' });

  // 2. Cambiar a rol OWNER desde selector
  const ownerBtn = page.getByText('Owner').first();
  await ownerBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/03_role_switched_owner.png' });

  // 3. Cambiar a rol AGENCIA desde selector
  const agenciaBtn = page.getByText('Agencia').first();
  await agenciaBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/04_role_switched_agency.png' });

  // 4. Cerrar Sesión
  const logoutBtn = page.getByText('Cerrar Sesión').first();
  await logoutBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/05_after_logout_login.png' });
});
