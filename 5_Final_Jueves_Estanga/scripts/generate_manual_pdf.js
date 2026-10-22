const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateManualPdf() {
  console.log('Iniciando generación de PDF con Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, '../backend/public/manual/index.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Cargando archivo: ${fileUrl}`);

  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const outputPath = path.resolve(__dirname, '../backend/public/manual/manual-operativo-surf-rental-mdp.pdf');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm',
    },
  });

  await browser.close();
  console.log(`PDF generado exitosamente en: ${outputPath}`);
  const stats = fs.statSync(outputPath);
  console.log(`Tamaño del archivo PDF: ${stats.size} bytes`);
}

generateManualPdf().catch((err) => {
  console.error('Error al generar PDF:', err);
  process.exit(1);
});
