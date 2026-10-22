const { chromium } = require('playwright');
const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const ARTIFACTS_DIR = 'C:/Users/Luish/.gemini/antigravity/brain/9175950e-9cef-429c-b767-14b36e4e653f';

async function seedTestData() {
  const ownerId = '71156b2d-2f48-4041-b117-603eaf9e90e3';
  const consumer = await prisma.user.findFirst({ where: { role: 'CONSUMER' } });
  const board = await prisma.board.findFirst({ where: { ownerId } });

  if (!consumer || !board) {
    throw new Error('Consumer or board not found');
  }

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  await prisma.insuranceClaim.deleteMany({
    where: { rentalId: { in: ['rental-verify-clean-1', 'rental-verify-damage-1'] } }
  }).catch(() => {});

  await prisma.rental.deleteMany({
    where: { id: { in: ['rental-verify-clean-1', 'rental-verify-damage-1'] } }
  }).catch(() => {});

  // 1. Rental Limpio
  await prisma.rental.create({
    data: {
      id: 'rental-verify-clean-1',
      consumerId: consumer.id,
      boardId: board.id,
      fechaInicio: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      fechaFinEstimada: twoHoursAgo,
      fechaDevolucionReal: twoHoursAgo,
      horas: 3,
      precioBase: 12000,
      descuento: 0,
      precioSeguro: 2000,
      precioTotal: 14000,
      gananciaOwner: 13300,
      gananciaAgencia: 700,
      estado: 'DEVUELTA',
      descripcionDanio: null,
      lavada: true,
      multaLavado: 0,
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
    }
  });

  // 2. Rental con Daño
  await prisma.rental.create({
    data: {
      id: 'rental-verify-damage-1',
      consumerId: consumer.id,
      boardId: board.id,
      fechaInicio: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      fechaFinEstimada: oneHourAgo,
      fechaDevolucionReal: oneHourAgo,
      horas: 3,
      precioBase: 12000,
      descuento: 0,
      precioSeguro: 2000,
      precioTotal: 14000,
      gananciaOwner: 13300,
      gananciaAgencia: 700,
      estado: 'PENDIENTE_REVISION',
      descripcionDanio: 'Golpe visible de 4cm en canto izquierdo con fisura en fibra',
      lavada: true,
      multaLavado: 0,
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'],
    }
  });

  console.log('✅ Seeded 2 test rentals for owner verification');
}

async function run() {
  await seedTestData();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Switch to Owner role if not already
  const ownerSwitchBtn = page.locator('text=Dueño').or(page.locator('text=OWNER')).or(page.locator('text=Dueño (Martín)'));
  if (await ownerSwitchBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await ownerSwitchBtn.first().click();
    await page.waitForTimeout(1000);
  }

  // Navigate to Revisiones tab
  console.log('Navigating to Revisiones tab...');
  const revisionsTab = page.locator('text=Revisiones').first();
  await revisionsTab.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '62_owner_revisions_list.png') });
  console.log('📸 Captured 62_owner_revisions_list.png');

  // Verify cards are visible
  const approveCleanBtn = page.getByTestId('btn-approve-rental-verify-clean-1');
  await approveCleanBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Found approve button for clean rental');

  // TEST FLOW 1: Aprobar Sin Daños
  console.log('--- TESTING FLOW 1: Aprobar Sin Daños ---');
  await approveCleanBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '63_confirm_approve_dialog.png') });
  console.log('📸 Captured 63_confirm_approve_dialog.png');

  // Click confirm button in modal
  const confirmApproveBtn = page.getByTestId('btn-confirm-approve');
  await confirmApproveBtn.waitFor({ state: 'visible', timeout: 3000 });
  await confirmApproveBtn.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '64_card_disappeared_success.png') });
  console.log('📸 Captured 64_card_disappeared_success.png');

  // Verify in DB that clean rental is now approved conforme
  const cleanRentalAfter = await prisma.rental.findUnique({ where: { id: 'rental-verify-clean-1' } });
  console.log('DB Clean rental after approval:', cleanRentalAfter.estado, cleanRentalAfter.descripcionDanio);
  if (cleanRentalAfter.descripcionDanio !== '[CONFORME_APROBADO_OWNER]') {
    throw new Error('rental-verify-clean-1 was not marked with [CONFORME_APROBADO_OWNER]');
  }

  // TEST FLOW 2: Aprobar con Daños / Reportar Daño
  console.log('--- TESTING FLOW 2: Aprobar con Daños ---');
  const claimDamageBtn = page.getByTestId('btn-claim-rental-verify-damage-1');
  await claimDamageBtn.waitFor({ state: 'visible', timeout: 5000 });
  await claimDamageBtn.click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '65_claim_modal_opened.png') });
  console.log('📸 Captured 65_claim_modal_opened.png');

  // Click $25.000 preset pill
  const presetPill = page.locator('text=$25.000 (Grave)').first();
  if (await presetPill.isVisible({ timeout: 2000 }).catch(() => false)) {
    await presetPill.click();
    await page.waitForTimeout(400);
    console.log('Selected $25.000 preset');
  }

  // Click submit claim button
  const submitClaimBtn = page.getByTestId('btn-submit-claim');
  await submitClaimBtn.waitFor({ state: 'visible', timeout: 3000 });
  console.log('Clicking submit claim button...');
  await submitClaimBtn.click();
  await page.waitForTimeout(2500);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '66_all_revisions_resolved_empty_state.png') });
  console.log('📸 Captured 66_all_revisions_resolved_empty_state.png');

  // Verify in DB that damage rental is now in RECLAMO and claim was created
  const damageRentalAfter = await prisma.rental.findUnique({
    where: { id: 'rental-verify-damage-1' },
    include: { claims: true }
  });
  console.log('DB Damage rental after claim:', damageRentalAfter.estado, 'Claims count:', damageRentalAfter.claims.length);
  if (damageRentalAfter.estado !== 'RECLAMO') {
    throw new Error('rental-verify-damage-1 state is not RECLAMO, actual: ' + damageRentalAfter.estado);
  }
  if (damageRentalAfter.claims.length === 0) {
    throw new Error('No insurance claim was created for rental-verify-damage-1');
  }
  console.log('Insurance claim details:', {
    montoReclamado: Number(damageRentalAfter.claims[0].montoReclamado),
    descripcion: damageRentalAfter.claims[0].descripcion,
    estado: damageRentalAfter.claims[0].estado
  });

  await browser.close();
  console.log('🎉 ALL OWNER REVISION TESTS PASSED PERFECTLY!');
}

run()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
