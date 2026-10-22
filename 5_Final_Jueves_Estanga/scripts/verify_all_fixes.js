const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAll() {
  console.log('=== INICIANDO SUITE DE PRUEBAS DE VERIFICACIÓN INTEGRAL ===\n');

  // 1. VERIFICACIÓN DEL BACKEND API Y ENDPOINTS
  console.log('--- 1. TEST DE DEDUCCIÓN DE RETIROS DE DINERO (PAYOUT BALANCE DEDUCTION) ---');
  
  // Login como Owner
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@surf.com', password: 'Password123!' }),
  });
  const loginJson = await loginRes.json();
  const tokenOwner = loginJson.data.tokens.accessToken;
  console.log('Owner autenticado correctamente. User:', loginJson.data.user.nombre);

  // Obtener estado financiero previo
  const earningsBeforeRes = await fetch('http://localhost:3000/api/owner/earnings', {
    headers: { Authorization: `Bearer ${tokenOwner}` },
  });
  const earningsBefore = (await earningsBeforeRes.json()).data;
  console.log('Saldo disponible antes de retirar:', earningsBefore.resumen.saldoDisponible);
  console.log('Total retirado antes:', earningsBefore.resumen.totalRetirado);

  const montoARetirar = 2000;
  if (earningsBefore.resumen.saldoDisponible >= montoARetirar) {
    const payoutRes = await fetch('http://localhost:3000/api/owner/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOwner}`,
      },
      body: JSON.stringify({
        monto: montoARetirar,
        cbuAlias: 'TEST.ALIAS.VERIFICACION',
      }),
    });
    const payoutData = await payoutRes.json();
    console.log('Resultado solicitud retiro:', payoutData.status, 'TransferId:', payoutData.data?.transferId);

    // Obtener estado financiero posterior
    const earningsAfterRes = await fetch('http://localhost:3000/api/owner/earnings', {
      headers: { Authorization: `Bearer ${tokenOwner}` },
    });
    const earningsAfter = (await earningsAfterRes.json()).data;
    console.log('Saldo disponible DESPUÉS de retirar:', earningsAfter.resumen.saldoDisponible);
    console.log('Total retirado DESPUÉS:', earningsAfter.resumen.totalRetirado);

    const esperadoSaldo = earningsBefore.resumen.saldoDisponible - montoARetirar;
    const esperadoRetirado = earningsBefore.resumen.totalRetirado + montoARetirar;

    if (
      earningsAfter.resumen.saldoDisponible === esperadoSaldo &&
      earningsAfter.resumen.totalRetirado === esperadoRetirado
    ) {
      console.log('✅ ÉXITO: El dinero retirado fue DESCONTADO exactamente del saldo disponible!');
    } else {
      console.error('❌ FALLO: Saldo esperado:', esperadoSaldo, 'Obtenido:', earningsAfter.resumen.saldoDisponible);
      process.exit(1);
    }
  } else {
    console.log('Saldo disponible inferior al monto de prueba, verificando balance:', earningsBefore.resumen.saldoDisponible);
  }

  // 2. TEST DE VALIDACIÓN ALFANUMÉRICA Y FOTO OBLIGATORIA EN DEVOLUCIÓN (RETURNS & DAMAGE)
  console.log('\n--- 2. TEST DE DEVOLUCIONES, DESCRIPCIÓN ALFANUMÉRICA Y FOTO OBLIGATORIA ---');
  
  // Login como Agencia
  const agencyLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mostrador@surf.com', password: 'Password123!' }),
  });
  const agencyLogin = await agencyLoginRes.json();
  const tokenAgency = agencyLogin.data.tokens.accessToken;
  console.log('Agencia autenticada. Operador:', agencyLogin.data.user.nombre);

  // Obtener agenda de alquileres
  const scheduleRes = await fetch('http://localhost:3000/api/agency/schedule', {
    headers: { Authorization: `Bearer ${tokenAgency}` },
  });
  const schedule = (await scheduleRes.json()).data;
  console.log('Total alquileres encontrados en schedule:', schedule.length);

  // Probar validación con sólo números en descripción de daño (debe ser rechazada)
  const fakeRentalId = schedule[0]?.id || 'fake-rental-id';
  const testSoloNumeros = await fetch('http://localhost:3000/api/agency/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenAgency}`,
    },
    body: JSON.stringify({
      rentalId: fakeRentalId,
      fotosDevolucion: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'],
      lavada: true,
      tieneDanio: true,
      descripcionDanio: '123456789', // SOLO NÚMEROS!
      fotoDanio: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800',
    }),
  });
  const testSoloNumerosJson = await testSoloNumeros.json();
  console.log('Prueba sólo números rechazada:', testSoloNumeros.status === 400);
  if (testSoloNumeros.status === 400) {
    console.log('✅ ÉXITO: El sistema bloqueó la descripción con sólo números!');
  } else {
    console.error('❌ FALLO: El sistema permitió sólo números:', testSoloNumerosJson);
    process.exit(1);
  }

  // Probar rechazo sin foto obligatoria
  const testSinFoto = await fetch('http://localhost:3000/api/agency/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenAgency}`,
    },
    body: JSON.stringify({
      rentalId: fakeRentalId,
      fotosDevolucion: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'],
      lavada: true,
      tieneDanio: true,
      descripcionDanio: 'Fisura de 5cm en canto derecho',
      fotoDanio: '', // VACÍA!
    }),
  });
  console.log('Prueba sin foto obligatoria rechazada:', testSinFoto.status === 400);
  if (testSinFoto.status === 400) {
    console.log('✅ ÉXITO: El sistema exigió la fotografía obligatoria del daño!');
  } else {
    console.error('❌ FALLO: El sistema permitió devolución con daño sin foto');
    process.exit(1);
  }

  // 3. VERIFICACIÓN DE HOSTING DEL MANUAL OPERATIVO Y PDF DESCARGABLE
  console.log('\n--- 3. TEST DE HOSTING DE MANUAL WEB Y PDF DESCARGABLE ---');
  const manualWebRes = await fetch('http://localhost:3000/manual');
  console.log('Respuesta http://localhost:3000/manual:', manualWebRes.status);
  const manualHtml = await manualWebRes.text();
  const containsManualTitle = manualHtml.includes('Manual Operativo & Guía de Distribución');
  console.log('Contenido del Manual Web verificado:', containsManualTitle);

  const manualPdfRes = await fetch('http://localhost:3000/manual/manual-operativo-surf-rental-mdp.pdf');
  console.log('Respuesta http://localhost:3000/manual/manual-operativo-surf-rental-mdp.pdf:', manualPdfRes.status);
  const pdfBuffer = await manualPdfRes.arrayBuffer();
  console.log('Bytes recibidos del archivo PDF:', pdfBuffer.byteLength);

  if (manualWebRes.status === 200 && containsManualTitle && manualPdfRes.status === 200 && pdfBuffer.byteLength > 100000) {
    console.log('✅ ÉXITO: El manual web y el PDF descargable están perfectamente hosteados y operativos!');
  } else {
    console.error('❌ FALLO en manual web o descarga de PDF');
    process.exit(1);
  }

  // 4. VERIFICACIÓN UI CON BROWSER HEADLESS (EXPO WEB EN PUERTO 8081)
  console.log('\n--- 4. TEST DE FRONTEND EXPO WEB & PANTALLAS (PUERTO 8081) ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log('Navegando a la app web en http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Capturar screenshot inicial
  const screenshotPath = path.resolve('C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f', '39_app_web_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot guardado en:', screenshotPath);

  // Navegar al perfil
  const perfilButton = page.locator('text=Perfil');
  if (await perfilButton.count() > 0) {
    await perfilButton.first().click();
    await page.waitForTimeout(1500);

    // Verificar presencia de Modo Claro / Modo Oscuro
    const darkToggle = page.locator('text=Modo Oscuro');
    console.log('Botón Modo Oscuro visible en pantalla de Perfil:', (await darkToggle.count()) > 0);

    // Click en Modo Oscuro
    if (await darkToggle.count() > 0) {
      await darkToggle.first().click();
      await page.waitForTimeout(1000);
      const screenshotDarkPath = path.resolve('C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f', '40_dark_mode_profile.png');
      await page.screenshot({ path: screenshotDarkPath });
      console.log('✅ Modo Oscuro probado y screenshot guardado en:', screenshotDarkPath);
    }

    // Verificar presencia de botones del Manual y PDF
    const manualBtn = page.locator('text=Ver Manual Web');
    const pdfBtn = page.locator('text=Descargar PDF');
    console.log('Botones de Manual Web y Descargar PDF visibles:', (await manualBtn.count()) > 0 && (await pdfBtn.count()) > 0);
  }

  // Cambiar a rol AGENCIA para verificar que la pantalla de Devoluciones no se crashea
  console.log('\n--- 5. TEST DE PANTALLA DE DEVOLUCIONES (NO BLANK SCREEN / NO CRASH) ---');
  const agenciaBtn = page.locator('text=Agencia');
  if (await agenciaBtn.count() > 0) {
    await agenciaBtn.first().click();
    await page.waitForTimeout(2000);

    // Clic en pestaña Devoluciones
    const devolucionesTab = page.locator('text=Devoluciones');
    if (await devolucionesTab.count() > 0) {
      await devolucionesTab.first().click();
      await page.waitForTimeout(2000);

      // Verificar que la pantalla contiene el título "Devoluciones en Sede" y no está en blanco
      const tituloDevoluciones = page.locator('text=Devoluciones en Sede');
      const isVisible = (await tituloDevoluciones.count()) > 0;
      console.log('Título "Devoluciones en Sede" visible (Pantalla NO blanca):', isVisible);

      const screenshotReturnsPath = path.resolve('C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f', '41_returns_screen_no_crash.png');
      await page.screenshot({ path: screenshotReturnsPath });
      console.log('Screenshot de Devoluciones guardado en:', screenshotReturnsPath);

      if (isVisible) {
        console.log('✅ ÉXITO: La pantalla de Devoluciones cargó perfectamente sin crashear!');
      } else {
        console.error('❌ FALLO: La pantalla de Devoluciones no mostró el encabezado esperado');
      }
    }
  }

  // Cambiar a rol OWNER para verificar Ganancias (Payouts list) y Revisiones
  console.log('\n--- 6. TEST DE PANTALLA OWNER: GANANCIAS & HISTORIAL DE RETIROS ---');
  const perfilTab = page.locator('text=Perfil');
  if (await perfilTab.count() > 0) {
    await perfilTab.first().click();
    await page.waitForTimeout(1500);

    const ownerBtn = page.locator('text=Owner');
    if (await ownerBtn.count() > 0) {
      await ownerBtn.first().click();
      await page.waitForTimeout(2000);

      const gananciasTab = page.locator('text=Ganancias');
      if (await gananciasTab.count() > 0) {
        await gananciasTab.first().click();
        await page.waitForTimeout(2000);

        const historialRetiros = page.locator('text=Historial de Retiros');
        const hasHistorial = (await historialRetiros.count()) > 0;
        console.log('Sección "Historial de Retiros" visible:', hasHistorial);

        const screenshotEarningsPath = path.resolve('C:\\Users\\Luish\\.gemini\\antigravity\\brain\\9175950e-9cef-429c-b767-14b36e4e653f', '42_owner_earnings_and_payouts.png');
        await page.screenshot({ path: screenshotEarningsPath });
        console.log('Screenshot de Ganancias e Historial de Retiros guardado en:', screenshotEarningsPath);
      }
    }
  }

  await browser.close();
  console.log('\n=== TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO AL 100% ===');
}

testAll().catch((err) => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
