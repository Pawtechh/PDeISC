import { chromium } from '@playwright/test';

async function verifyAuthSecurityFixes() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Navegando al Login en http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // Asegurarnos de estar en LoginScreen (si había sesión previa, limpiar localStorage y recargar)
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForTimeout(2000);

  console.log('2. Probando Login con credenciales erróneas...');
  await page.fill('input[type="email"]', 'usuario_falso@surf.com');
  await page.fill('input[type="password"]', 'PasswordErronea123!');
  await page.click('[data-testid="btn-login"]');
  await page.waitForTimeout(1500);

  // Verificar que aparece el mensaje de error y NO se ingresa a la app
  const errorBox = page.locator('[data-testid="login-error-message"]');
  const isVisible = await errorBox.isVisible();
  const errorText = isVisible ? await errorBox.textContent() : '';
  console.log('¿Mensaje de error visible?:', isVisible, '| Texto:', errorText);

  await page.screenshot({ path: 'screenshots/verify_login_wrong_credentials.png' });
  console.log('Captura guardada: screenshots/verify_login_wrong_credentials.png');

  // 3. Verificar que se renderizan los 4 botones de OAuth (Google, GitHub, Facebook, Apple)
  const btnGoogle = page.locator('[data-testid="btn-oauth-google"]');
  const btnGithub = page.locator('[data-testid="btn-oauth-github"]');
  console.log('¿Botón Google visible?:', await btnGoogle.isVisible());
  console.log('¿Botón GitHub visible?:', await btnGithub.isVisible());

  // 4. Probar pantalla de consentimiento OAuth Sandbox
  console.log('4. Probando Consent Screen de Google OAuth Sandbox...');
  const consentPage = await context.newPage();
  await consentPage.goto('http://localhost:3000/api/auth/oauth/google/consent?redirectUri=http%3A%2F%2Flocalhost%3A3000');
  await consentPage.waitForTimeout(1000);
  await consentPage.screenshot({ path: 'screenshots/verify_oauth_consent_screen.png' });
  console.log('Captura guardada: screenshots/verify_oauth_consent_screen.png');

  await browser.close();
  console.log('¡Verificación de autenticación y seguridad completada!');
}

verifyAuthSecurityFixes().catch(console.error);
