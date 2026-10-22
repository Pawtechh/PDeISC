import { test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 1200 } });
test.setTimeout(60000);

test('Capturar todas las tarjetas de tablas en catálogo', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // Ir a Consumer -> Catálogo
  await page.getByText('Consumer').first().click();
  await page.waitForTimeout(1500);
  await page.getByText('Catálogo').first().click();
  await page.waitForTimeout(2000);

  // Capturar vista 1
  await page.screenshot({ path: 'screenshots/board_cards_1.png' });

  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/board_cards_2.png' });

  // Scroll down more
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/board_cards_3.png' });

  // Scroll down more
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/board_cards_4.png' });
});
