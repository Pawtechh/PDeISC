import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navegando a http://localhost:3000 ...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // 1. Login como consumidor si está en login
  const emailInput = page.locator('input[type="email"], input[data-testid="login-input-email"]');
  if (await emailInput.count() > 0 && await emailInput.first().isVisible()) {
    console.log('Iniciando sesión...');
    await emailInput.first().fill('consumer@surf.com');
    await page.locator('input[type="password"], input[data-testid="login-input-password"]').first().fill('Password123!');
    const submitBtn = page.locator('button, [data-testid="btn-login"], [role="button"]').filter({ hasText: /Ingresar|Iniciar Sesión/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2500);
  }

  // 2. Ir a la pestaña Catálogo
  const catalogTab = page.locator('[role="button"], a, div').filter({ hasText: /Catálogo/i }).first();
  if (await catalogTab.isVisible()) {
    console.log('Abriendo Catálogo...');
    await catalogTab.click();
    await page.waitForTimeout(1500);
  }

  // 3. Cliquear en una tabla
  const cardOrDetail = page.locator('[role="button"]').filter({ hasText: /Ver Detalle|Reservar/i }).first();
  if (await cardOrDetail.isVisible()) {
    console.log('Seleccionando tabla...');
    await cardOrDetail.click();
    await page.waitForTimeout(1500);
  }

  // 4. Si abrió modal de detalle, tocar Reservar Tabla
  const btnReservar = page.locator('[data-testid="btn-reservar-tabla"], [role="button"]').filter({ hasText: /Reservar Tabla/i }).first();
  if (await btnReservar.isVisible()) {
    console.log('Abriendo Checkout...');
    await btnReservar.click();
    await page.waitForTimeout(2000);
  }

  // 5. Scroll hacia la sección de programar retiro
  const scheduleSection = page.locator('[data-testid="checkout-schedule-card"]').first();
  if (await scheduleSection.isVisible()) {
    console.log('Haciendo scroll a Programar Retiro en Sede...');
    await scheduleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // 6. Captura 1: Vista Cuadrícula inicial con los slots y filtros
  await page.screenshot({ path: 'screenshots/verify_time_slots_grid.png' });
  console.log('Captura guardada: screenshots/verify_time_slots_grid.png');

  // 7. Probar filtro "Solo Libres"
  const libresBtn = page.locator('[role="button"], div').filter({ hasText: /Solo Libres/i }).first();
  if (await libresBtn.isVisible()) {
    console.log('Filtrando por Solo Libres...');
    await libresBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/verify_time_slots_libres.png' });
    console.log('Captura guardada: screenshots/verify_time_slots_libres.png');
  }

  // 8. Probar cambio a modo Carrusel y cliquear flechas ◀ ▶
  const toggleBtn = page.locator('[data-testid="btn-toggle-slot-view-mode"]').first();
  if (await toggleBtn.isVisible()) {
    console.log('Cambiando a modo Carrusel...');
    await toggleBtn.click();
    await page.waitForTimeout(1000);

    // Clic en flecha derecha ▶
    const arrowRight = page.locator('text=▶').first();
    if (await arrowRight.isVisible()) {
      console.log('Navegando con flecha ▶...');
      await arrowRight.click();
      await page.waitForTimeout(800);
      await arrowRight.click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({ path: 'screenshots/verify_time_slots_carousel.png' });
    console.log('Captura guardada: screenshots/verify_time_slots_carousel.png');
  }

  await browser.close();
  console.log('¡Verificación de navegación de horarios finalizada con éxito!');
})();
