import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 420, height: 950 } });

test('Flujo de Validación Estricta de Formularios (Bloque 2)', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    console.log(`Dialog detectado: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.accept();
  });

  // 1. Abrir la app en Expo Web
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2500);

  // 2. Navegar a RegisterScreen
  const registerLink = page.getByText('Registrate acá').first();
  if (await registerLink.isVisible()) {
    await registerLink.click();
    await page.waitForTimeout(1500);
  }

  // 3. Probar datos inválidos para forzar errores y botón disabled
  const inputNombre = page.getByTestId('register-input-nombre');
  const inputApellido = page.getByTestId('register-input-apellido');
  const inputEmail = page.getByTestId('register-input-email');
  const inputDni = page.getByTestId('register-input-dni');
  const inputTelefono = page.getByTestId('register-input-telefono');
  const inputPassword = page.getByTestId('register-input-password');
  const inputConfirmar = page.getByTestId('register-input-confirmarPassword');
  const inputFecha = page.getByTestId('register-input-fechaNacimiento');

  // Llenar datos deliberadamente inválidos
  if (await inputNombre.isVisible()) {
    await inputNombre.fill('Lucas123'); // Números no permitidos
    await inputApellido.fill('P'); // Menos de 2 chars
    await inputEmail.fill('invalido-sin-arroba');
    await inputDni.fill('1234'); // Menor a 7 dígitos
    await inputTelefono.fill('123'); // Menor a 10 dígitos
    await inputPassword.fill('debil'); // Sin mayúscula, número ni símbolo
    await inputConfirmar.fill('distinta'); // No coincide
    await page.waitForTimeout(1000);

    // Capturar screenshot del formulario inválido con mensajes de error
    await page.screenshot({ path: 'screenshots/06_register_form_invalid_errors.png' });
  }

  // 4. Llenar datos válidos en todos los campos
  if (await inputNombre.isVisible()) {
    await inputNombre.fill('Lucas');
    await inputApellido.fill('Peralta');
    const uniqueEmail = `lucas.surf.${Date.now()}@surfmdp.com`;
    await inputEmail.fill(uniqueEmail);
    // Generar un DNI único de 8 dígitos para evitar colisión en MySQL
    const uniqueDni = String(30000000 + Math.floor(Math.random() * 9000000));
    await inputDni.fill(uniqueDni);
    await inputTelefono.fill('2235123456');
    await inputPassword.fill('SurfMDP2026!');
    await inputConfirmar.fill('SurfMDP2026!');

    // Tildar checkbox de términos
    const checkboxTerminos = page.getByTestId('checkbox-terminos');
    if (await checkboxTerminos.isVisible()) {
      await checkboxTerminos.click();
    }

    await page.waitForTimeout(1500);

    // Capturar screenshot con checks verdes y botón habilitado
    await page.screenshot({ path: 'screenshots/07_register_form_valid_green_checks.png' });

    // 5. Enviar formulario
    const btnCrear = page.getByTestId('btn-crear-cuenta');
    if (await btnCrear.isVisible()) {
      await btnCrear.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'screenshots/08_register_form_submitted.png' });
    }
  }

  // 6. Validar pantalla de Login
  // Si estamos logueados, cerramos sesión para volver a LoginScreen
  const perfilTab = page.getByText('Perfil').first();
  if (await perfilTab.isVisible()) {
    await perfilTab.click();
    await page.waitForTimeout(1000);
    const logoutBtn = page.getByText('Cerrar Sesión').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  // En LoginScreen: validar inputs y checks
  const loginEmail = page.getByTestId('login-input-email');
  const loginPass = page.getByTestId('login-input-password');
  if (await loginEmail.isVisible() && await loginPass.isVisible()) {
    await loginEmail.fill('consumer@surf.com');
    await loginPass.fill('Password123!');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/09_login_form_valid.png' });
  }
});

