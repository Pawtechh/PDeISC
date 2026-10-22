import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(75000);

test('Verificación de Disponibilidad: Bloqueo de solapamiento y franjas horarias ocupadas', async ({ page, request }) => {
  // Limpiar reservas de prueba antes de comenzar
  try {
    execSync('powershell -Command "& \\"C:\\xampp\\mysql\\bin\\mysql.exe\\" -u root -e \\"DELETE FROM surf_rental.Payment WHERE rentalId NOT LIKE \'rental-%\'; DELETE FROM surf_rental.Rental WHERE id NOT LIKE \'rental-%\'; UPDATE surf_rental.Board SET estado = \'DISPONIBLE\' WHERE estado = \'ALQUILADA\' AND id NOT IN (SELECT boardId FROM surf_rental.Rental WHERE estado IN (\'ACTIVA\', \'EN_CURSO\'));\\""');
  } catch {}

  // -------------------------------------------------------------------------
  // FASE 1: Verificación a Nivel Backend (Reglas de Negocio y HTTP 409 Conflict)
  // -------------------------------------------------------------------------
  // 1. Iniciar sesión como Consumer
  const loginRes = await request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'consumer@surf.com',
      password: 'Password123!',
    },
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginData = await loginRes.json();
  const token = loginData.data.tokens.accessToken;

  // Mañana a las 10:00 hs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const fechaInicio10 = tomorrow.toISOString();

  // A. Crear primera reserva en board-seed-1 de 10:00 a 14:00 (4 hs)
  console.log('1. Creando Reserva 1 en board-seed-1 (10:00 - 14:00 hs)...');
  const res1 = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-1',
      horas: 4,
      fechaInicio: fechaInicio10,
      versionTerminos: '1.0',
    },
  });
  expect(res1.status()).toBe(201);
  const data1 = await res1.json();
  expect(data1.status).toBe('success');
  console.log('✅ Reserva 1 creada exitosamente:', data1.data?.rental?.id);

  // B. Intentar reservar la MISMA tabla en el MISMO horario (10:00 hs)
  console.log('2. Intentando Reserva 2: Misma tabla, EXACTAMENTE el mismo horario (10:00 hs)...');
  const resSame = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-1',
      horas: 4,
      fechaInicio: fechaInicio10,
      versionTerminos: '1.0',
    },
  });
  expect(resSame.status()).toBe(409);
  const dataSame = await resSame.json();
  expect(dataSame.code).toBe('RENTAL_CONFLICT');
  expect(dataSame.message).toContain('La tabla ya tiene una reserva activa en esa franja horaria');
  console.log('✅ Mismo horario bloqueado con 409 RENTAL_CONFLICT:', dataSame.message);

  // C. Intentar reservar la MISMA tabla en HORARIO SOLAPADO (11:30 hs, cae dentro de 10:00 - 14:00)
  console.log('3. Intentando Reserva 3: Misma tabla, horario solapado intermedio (11:30 - 13:30 hs)...');
  const tomorrow1130 = new Date(tomorrow);
  tomorrow1130.setHours(11, 30, 0, 0);
  const resOverlap = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-1',
      horas: 2,
      fechaInicio: tomorrow1130.toISOString(),
      versionTerminos: '1.0',
    },
  });
  expect(resOverlap.status()).toBe(409);
  const dataOverlap = await resOverlap.json();
  expect(dataOverlap.code).toBe('RENTAL_CONFLICT');
  expect(dataOverlap.message).toContain('La tabla ya tiene una reserva activa en esa franja horaria');
  console.log('✅ Horario solapado bloqueado con 409 RENTAL_CONFLICT:', dataOverlap.message);

  // D. Intentar reservar la MISMA tabla en HORARIO SOLAPADO INICIO (09:00 hs por 2 hs: 09:00 - 11:00)
  console.log('4. Intentando Reserva 4: Misma tabla, solapamiento al inicio (09:00 - 11:00 hs)...');
  const tomorrow09 = new Date(tomorrow);
  tomorrow09.setHours(9, 0, 0, 0);
  const resOverlapStart = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-1',
      horas: 2,
      fechaInicio: tomorrow09.toISOString(),
      versionTerminos: '1.0',
    },
  });
  expect(resOverlapStart.status()).toBe(409);
  const dataOverlapStart = await resOverlapStart.json();
  expect(dataOverlapStart.code).toBe('RENTAL_CONFLICT');
  expect(dataOverlapStart.message).toContain('La tabla ya tiene una reserva activa en esa franja horaria');
  console.log('✅ Solapamiento al inicio bloqueado con 409 RENTAL_CONFLICT');

  // E. Reservar la MISMA tabla en HORARIO POSTERIOR NO SUPERPUESTO (14:00 - 18:00 hs)
  console.log('5. Intentando Reserva 5: Misma tabla, horario contiguo sin superposición (14:00 - 18:00 hs)...');
  const tomorrow14 = new Date(tomorrow);
  tomorrow14.setHours(14, 0, 0, 0);
  const resNextSlot = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-1',
      horas: 4,
      fechaInicio: tomorrow14.toISOString(),
      versionTerminos: '1.0',
    },
  });
  expect(resNextSlot.status()).toBe(201);
  console.log('✅ Horario contiguo sin superposición aceptado correctamente (201)');

  // F. Reservar OTRA TABLA DISTINTA (board-seed-2) en ese MISMO horario (10:00 - 14:00 hs)
  console.log('6. Intentando Reserva 6: Tabla distinta en el mismo horario (10:00 - 14:00 hs)...');
  const resDifferentBoard = await request.post('http://localhost:3000/api/rentals', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      boardId: 'board-seed-2',
      horas: 4,
      fechaInicio: fechaInicio10,
      versionTerminos: '1.0',
    },
  });
  expect(resDifferentBoard.status()).toBe(201);
  console.log('✅ Tabla distinta en el mismo horario permitida correctamente (201)');

  // -------------------------------------------------------------------------
  // FASE 2: Verificación en la UI (Expo Web / Catálogo y Checkout)
  // -------------------------------------------------------------------------
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  // Acceder como Consumer
  const consumerBtn = page.getByText('Consumer').first();
  await consumerBtn.click();
  await page.waitForTimeout(1500);

  // Ir a pestaña Catálogo
  const catalogTab = page.getByText('Catálogo').first();
  await catalogTab.click();
  await page.waitForTimeout(1000);

  // Abrir detalle de una tabla disponible
  const verDetalleBtn = page.getByText('Ver Detalle').first();
  await expect(verDetalleBtn).toBeVisible({ timeout: 5000 });
  await verDetalleBtn.click();
  await page.waitForTimeout(1500);

  // Click en "Reservar Tabla"
  const btnReservar = page.getByTestId('btn-reservar-tabla');
  await btnReservar.scrollIntoViewIfNeeded();
  await btnReservar.click();
  await page.waitForTimeout(1500);

  // Verificar que abre CheckoutScreen y renderiza franjas horarias
  await expect(page.getByTestId('checkout-title')).toBeVisible();
  const scheduleCard = page.getByTestId('checkout-schedule-card');
  await expect(scheduleCard).toBeVisible();

  // Seleccionar duración 4 hs
  const duration4h = page.getByTestId('checkout-duration-4h');
  await duration4h.click();
  await page.waitForTimeout(500);

  // Completar formulario de pago con tarjeta Visa de prueba
  const cardInput = page.getByTestId('checkout-input-card-number');
  await cardInput.scrollIntoViewIfNeeded();
  await cardInput.fill('4509953566233704');
  await page.getByTestId('checkout-input-card-name').fill('LUCAS PERALTA');
  await page.getByTestId('checkout-input-card-exp').fill('1228');
  await page.getByTestId('checkout-input-card-cvv').fill('123');
  await page.getByTestId('checkout-input-card-dni').fill('38123456');
  await page.waitForTimeout(500);

  // Confirmar y Pagar
  const btnPagar = page.getByTestId('checkout-btn-pagar-touchable');
  await btnPagar.scrollIntoViewIfNeeded();
  await btnPagar.click();
  await page.waitForTimeout(2500);

  // Verificar confirmación exitosa de la reserva
  await expect(page.getByTestId('checkout-success-card')).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: 'screenshots/30_availability_first_booking_success.png' });
  console.log('📸 Captura guardada: screenshots/30_availability_first_booking_success.png');

  // Click en "Ver Pase de Retiro en Mis Alquileres"
  const btnIrAlquileres = page.getByTestId('btn-ir-a-alquileres');
  await expect(btnIrAlquileres).toBeVisible({ timeout: 5000 });
  await btnIrAlquileres.click();
  await page.waitForTimeout(1000);

  // Cerrar modal de detalle si quedó visible
  const btnCerrarDetalle = page.getByText('✕ Cerrar').first();
  if (await btnCerrarDetalle.isVisible()) {
    await btnCerrarDetalle.click();
    await page.waitForTimeout(800);
  }

  // Tomar captura final del catálogo y navegación
  await page.screenshot({ path: 'screenshots/31_availability_catalog_updated.png' });
  console.log('📸 Captura guardada: screenshots/31_availability_catalog_updated.png');
});
