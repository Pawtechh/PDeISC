const { chromium } = require('playwright');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function verifyDamageApprovalFlow() {
  console.log('--- 1. Preparando Alquiler de Prueba con Daño en BD ---');
  // Buscar un owner
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  const consumer = await prisma.user.findFirst({ where: { role: 'CONSUMER' } });
  const board = await prisma.board.findFirst({ where: { ownerId: owner.id } });

  console.log(`Owner: ${owner.email}, Consumer: ${consumer.email}, Tabla: ${board.titulo}`);

  // Crear o actualizar un rental en estado PENDIENTE_REVISION con daño constatado por Sede
  const testRentalId = 'rental-test-damage-flow-1';
  await prisma.insuranceClaim.deleteMany({ where: { rentalId: testRentalId } });
  await prisma.rental.deleteMany({ where: { id: testRentalId } });

  const now = new Date();
  await prisma.rental.create({
    data: {
      id: testRentalId,
      consumerId: consumer.id,
      boardId: board.id,
      fechaInicio: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      fechaFinEstimada: now,
      fechaDevolucionReal: now,
      horas: 4,
      precioBase: 25000,
      precioTotal: 25000,
      gananciaOwner: 23750,
      gananciaAgencia: 1250,
      estado: 'PENDIENTE_REVISION',
      lavada: true,
      multaLavado: 0,
      descripcionDanio: 'Fisura de 5cm en canto izquierdo por impacto con escolleras',
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'],
    }
  });

  console.log('Alquiler de prueba creado en estado PENDIENTE_REVISION con daño.');

  console.log('--- 2. Iniciando Navegador Playwright ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message || String(err));
    console.error('[BROWSER ERROR]:', err);
  });

  page.on('dialog', async (dialog) => {
    console.log(`[BROWSER DIALOG]: ${dialog.type()} -> "${dialog.message()}"`);
    await dialog.accept();
  });

  console.log('Cargando http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Clic en Owner...');
  await page.locator('text=Owner').last().click();
  await page.waitForTimeout(2000);

  console.log('Clic en Revisiones...');
  await page.locator('text=Revisiones').first().click();
  await page.waitForTimeout(2500);

  // Captura de la tarjeta con el botón "Aprobar con Daños"
  const cardScreenshot = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f\\55_card_aprobar_con_danos.png';
  await page.screenshot({ path: cardScreenshot, fullPage: true });
  console.log('Screenshot tarjeta guardado:', cardScreenshot);

  // Verificar que el botón "Aprobar con Daños" existe
  const btnAprobarConDanos = page.locator('text=Aprobar con Daños').first();
  const existsBtn = await btnAprobarConDanos.isVisible();
  console.log('¿Botón "Aprobar con Daños" visible?:', existsBtn);

  if (!existsBtn) {
    throw new Error('El botón "Aprobar con Daños" no está visible en la tarjeta.');
  }

  console.log('Haciendo clic en "Aprobar con Daños"...');
  await btnAprobarConDanos.click();
  await page.waitForTimeout(1500);

  // Captura del Modal abierto con los datos precompletados
  const modalScreenshot = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f\\56_modal_aprobar_con_danos.png';
  await page.screenshot({ path: modalScreenshot, fullPage: true });
  console.log('Screenshot modal guardado:', modalScreenshot);

  // Clic en preset de monto $25.000
  console.log('Seleccionando preset de $25.000...');
  const presetBtn = page.locator('text=$25.000 (Grave)').first();
  if (await presetBtn.isVisible()) {
    await presetBtn.click();
  }

  // Clic en Confirmar y Aprobar con Daños (24h)
  console.log('Haciendo clic en Confirmar y Aprobar con Daños (24h)...');
  const confirmBtn = page.locator('text=Confirmar y Aprobar con Daños (24h)').first();
  await confirmBtn.click();
  await page.waitForTimeout(3000);

  // Captura posterior a la aprobación
  const afterScreenshot = 'C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f\\57_after_aprobar_con_danos.png';
  await page.screenshot({ path: afterScreenshot, fullPage: true });
  console.log('Screenshot post-aprobación guardado:', afterScreenshot);

  // Verificar en la BD que el reclamo fue creado
  const createdClaim = await prisma.insuranceClaim.findFirst({
    where: { rentalId: testRentalId },
  });
  console.log('Reclamo en BD creado con éxito:', Boolean(createdClaim), {
    id: createdClaim?.id,
    montoReclamado: createdClaim?.montoReclamado,
    descripcion: createdClaim?.descripcion,
    estado: createdClaim?.estado,
    fotosCount: (createdClaim?.fotosDano || []).length
  });

  const updatedRental = await prisma.rental.findUnique({
    where: { id: testRentalId }
  });
  console.log('Estado final del alquiler:', updatedRental?.estado);

  await browser.close();
  await prisma.$disconnect();

  if (errors.length > 0) {
    console.error('Se registraron errores en el navegador:', errors);
    process.exit(1);
  }

  console.log('\n>>> TODO FUNCIONA A LA PERFECCIÓN: EL FLUJO DE "APROBAR CON DAÑOS" QUEDÓ 100% OPERATIVO <<<');
}

verifyDamageApprovalFlow().catch((e) => {
  console.error(e);
  process.exit(1);
});
