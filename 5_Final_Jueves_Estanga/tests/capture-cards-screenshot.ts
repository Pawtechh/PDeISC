import { chromium } from 'playwright';

async function captureCards() {
  const browser = await chromium.launch();

  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const consumerBtn = mobilePage.locator('text=Consumer').first();
  if (await consumerBtn.count() > 0) {
    await consumerBtn.click();
  }
  await mobilePage.waitForTimeout(2000);

  // Scroll the scrollable container directly via JS evaluation
  await mobilePage.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const d of allDivs) {
      if (d.scrollHeight > d.clientHeight && d.clientHeight > 300) {
        d.scrollTop = 420;
      }
    }
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: 'screenshots/card_peek_carousel_mobile_scrolled.png' });

  await browser.close();
  console.log('Mobile scroll via element scrollTop captured!');
}

captureCards().catch(console.error);
