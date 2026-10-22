const { chromium } = require('playwright');

async function testRevisionsError() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('[BROWSER UNCAUGHT ERROR]:', err);
  });

  console.log('Navegando a http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Owner en la pantalla de login
  console.log('Haciendo clic en Owner...');
  await page.locator('text=Owner').last().click();
  await page.waitForTimeout(2500);

  // Clic en tab Revisiones
  console.log('Haciendo clic en tab Revisiones...');
  await page.locator('text=Revisiones').first().click();
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log('Longitud del HTML de la página:', html.length);
  const screenshotPath = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f\\debug_revisions_blank.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot guardado en:', screenshotPath);

  await browser.close();
}

testRevisionsError().catch(console.error);
