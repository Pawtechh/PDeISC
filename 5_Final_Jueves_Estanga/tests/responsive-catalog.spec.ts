import { test, expect } from '@playwright/test';

test.describe('Catálogo Responsive (1 / 2 / 3 columnas)', () => {
  test('Visualización en Mobile (1 columna)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(1500);

    // Acceder como Consumer
    await page.getByText('Consumer').first().click();
    await page.waitForTimeout(1500);

    // Ir a pestaña Catálogo
    const catalogoTab = page.getByText('Catálogo').first();
    if (await catalogoTab.isVisible()) {
      await catalogoTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/responsive_01_mobile_1col.png' });
  });

  test('Visualización en Tablet (2 columnas)', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(1500);

    // Acceder como Consumer
    await page.getByText('Consumer').first().click();
    await page.waitForTimeout(1500);

    const catalogoTab = page.getByText('Catálogo').first();
    if (await catalogoTab.isVisible()) {
      await catalogoTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/responsive_02_tablet_2col.png' });
  });

  test('Visualización en Desktop (3 columnas)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(1500);

    // Acceder como Consumer
    await page.getByText('Consumer').first().click();
    await page.waitForTimeout(1500);

    const catalogoTab = page.getByText('Catálogo').first();
    if (await catalogoTab.isVisible()) {
      await catalogoTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/responsive_03_desktop_3col.png' });
  });
});
