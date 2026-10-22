import { chromium } from 'playwright';

async function testThemeAndAutoplay() {
  const browser = await chromium.launch();

  // 1. TEST LIGHT MODE
  const lightCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const lightPage = await lightCtx.newPage();
  await lightPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await lightPage.waitForTimeout(1000);

  // Set Light Mode in localStorage
  await lightPage.evaluate(() => {
    localStorage.setItem('SR_THEME_MODE', 'light');
  });
  await lightPage.reload({ waitUntil: 'networkidle' });
  await lightPage.waitForTimeout(1000);

  const consumerBtn = lightPage.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  }
  await lightPage.waitForTimeout(2000);

  // Capture Light Mode Top View
  await lightPage.screenshot({ path: 'screenshots/verify_light_mode_catalog.png' });

  // Scroll down to see Light Mode Grid
  await lightPage.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll('*')).filter((el: any) => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    if (scrollers[0]) {
      scrollers[0].scrollTop = 580;
    }
  });
  await lightPage.waitForTimeout(600);
  await lightPage.screenshot({ path: 'screenshots/verify_light_mode_grid.png' });

  // 2. TEST AUTOPLAY (Wait 4.2 seconds to verify the carousel moves to the next card automatically)
  console.log('Testing autoplay on Dark Mode...');
  const darkCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const darkPage = await darkCtx.newPage();
  await darkPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await darkPage.waitForTimeout(1000);
  await darkPage.evaluate(() => {
    localStorage.setItem('SR_THEME_MODE', 'dark');
  });
  await darkPage.reload({ waitUntil: 'networkidle' });
  await darkPage.waitForTimeout(1000);

  const darkConsumer = darkPage.locator('text=Consumer').first();
  if (await darkConsumer.count() > 0) {
    await darkConsumer.click();
  }
  await darkPage.waitForTimeout(1500);

  // Capture Initial Dark Mode Card
  await darkPage.screenshot({ path: 'screenshots/verify_dark_mode_initial_card.png' });

  // Wait 4.2s for autoplay to advance to Card 2
  await darkPage.waitForTimeout(4200);
  await darkPage.screenshot({ path: 'screenshots/verify_dark_mode_autoplay_advanced.png' });

  await browser.close();
  console.log('Verification completed successfully!');
}

testThemeAndAutoplay().catch(console.error);
