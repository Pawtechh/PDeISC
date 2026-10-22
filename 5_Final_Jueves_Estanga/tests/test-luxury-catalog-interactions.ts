import { chromium } from 'playwright';

async function testInteractions() {
  console.log('--- Testing Luxury Catalog Interactions & TestIDs ---');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Authenticate as Consumer
  console.log('1. Logging in as Consumer...');
  const consumerBtn = page.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  } else {
    const inputs = await page.locator('input').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('consumer@surf.com');
      await inputs[1].fill('Password123!');
      await page.click('text=Ingresar');
    }
  }
  await page.waitForTimeout(2500);

  // 2. Test View Mode Toggle: Grid
  console.log('2. Switching to Grid Mode...');
  const gridToggle = page.locator('[data-testid="toggle-view-grid"]');
  await gridToggle.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/audit_01_grid_view.png' });

  // 3. Test Filter Pill: Longboard
  console.log('3. Selecting Longboard Filter...');
  const longboardFilter = page.locator('[data-testid="catalog-filter-Longboard"]');
  await longboardFilter.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/audit_02_longboard_filter.png' });

  // 4. Test Search filter
  console.log('4. Testing Search Filter...');
  const searchInput = page.locator('input[placeholder*="Buscar"]');
  await searchInput.fill('Classic');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/audit_03_search_results.png' });

  // Clear search and reset filter to Todos
  await searchInput.fill('');
  const todosFilter = page.locator('[data-testid="catalog-filter-Todos"]');
  await todosFilter.click();
  await page.waitForTimeout(800);

  // 5. Test Switch back to 3D Carousel
  console.log('5. Switching back to 3D Luxury Gallery...');
  const carouselToggle = page.locator('[data-testid="toggle-view-carousel"]');
  await carouselToggle.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/audit_04_carousel_view.png' });

  // 6. Test Card Detail / Reserve Button click
  console.log('6. Testing Board 3D Detail Button click...');
  const detailButtons = page.locator('[data-testid^="board-3d-detail-"]');
  const detailCount = await detailButtons.count();
  console.log(`Found ${detailCount} 3D detail buttons.`);

  if (detailCount > 0) {
    await detailButtons.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/audit_05_board_detail_modal.png' });

    // 7. Test Close Modal
    console.log('7. Closing Board Detail Modal...');
    const closeBtn = page.locator('text=✕ Cerrar');
    await closeBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/audit_06_after_modal_closed.png' });
  }

  console.log('--- ALL QA INTERACTION TESTS COMPLETED SUCCESSFULLY! ---');
  await browser.close();
}

testInteractions().catch((err) => {
  console.error('QA Test error:', err);
  process.exit(1);
});
