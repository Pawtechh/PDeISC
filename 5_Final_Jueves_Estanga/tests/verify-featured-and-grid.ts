import { chromium } from 'playwright';

async function testFeaturedAndGrid() {
  const browser = await chromium.launch();

  // 1. Mobile viewport
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const consumerBtn = page.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  }
  await page.waitForTimeout(2000);

  // Top of page showing header, weather, and the Featured Carousel with "DESTACADA"
  await page.screenshot({ path: 'screenshots/verify_featured_carousel_top.png' });

  // Scroll down RN Web container
  await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll('*')).filter((el: any) => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    if (scrollers[0]) {
      scrollers[0].scrollTop = 620;
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/verify_grid_below_carousel.png' });

  // 2. Desktop viewport
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  const desktopConsumer = desktopPage.locator('text=Consumer').first();
  if (await desktopConsumer.count() > 0) {
    await desktopConsumer.click();
  }
  await desktopPage.waitForTimeout(2000);

  await desktopPage.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll('*')).filter((el: any) => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    if (scrollers[0]) {
      scrollers[0].scrollTop = 580;
    }
  });
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: 'screenshots/verify_desktop_grid_scrolled.png' });

  await browser.close();
  console.log('Verification screenshots successfully saved!');
}

testFeaturedAndGrid().catch(console.error);
