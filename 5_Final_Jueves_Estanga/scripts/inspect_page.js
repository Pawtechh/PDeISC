const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const title = await page.title();
  const url = page.url();
  console.log('Title:', title);
  console.log('URL:', url);

  const texts = await page.locator('button, div[role="button"], a, h1, h2, input').allInnerTexts();
  console.log('Elements on page:', texts.filter(t => t.trim()).slice(0, 30));

  await page.screenshot({ path: 'screenshots/current_app_state.png' });
  console.log('Saved screenshots/current_app_state.png');

  await browser.close();
}

main().catch(console.error);
