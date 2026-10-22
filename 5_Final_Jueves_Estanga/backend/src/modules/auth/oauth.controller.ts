import { RequestHandler } from 'express';
import { oauthService } from './oauth.service';
import { SupportedOAuthProvider, OAUTH_CONFIG } from '../../config/oauth';

const validProviders: SupportedOAuthProvider[] = ['google', 'github', 'facebook', 'apple'];

export const initiateOAuth: RequestHandler = (req, res, next) => {
  try {
    const provider = req.params.provider?.toLowerCase() as SupportedOAuthProvider;

    if (!validProviders.includes(provider)) {
      res.status(400).json({
        code: 'INVALID_PROVIDER',
        message: `Proveedor no soportado. Los proveedores válidos son: [${validProviders.join(', ')}]`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const redirectUri = req.query.redirectUri as string | undefined;
    const authUrl = oauthService.getAuthorizationUrl(provider, redirectUri);

    // Si el cliente pide JSON
    if (req.headers.accept?.includes('application/json')) {
      res.status(200).json({
        data: { authUrl, provider },
      });
      return;
    }

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

export const handleCallback: RequestHandler = async (req, res, next) => {
  try {
    const provider = req.params.provider?.toLowerCase() as SupportedOAuthProvider;

    if (!validProviders.includes(provider)) {
      res.status(400).json({
        code: 'INVALID_PROVIDER',
        message: 'Proveedor no soportado',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const code = (req.query.code as string) || (req.body?.code as string);
    const redirectUri = (req.query.redirectUri as string) || (req.body?.redirectUri as string);

    if (!code) {
      res.status(400).json({
        code: 'MISSING_AUTH_CODE',
        message: 'Código de autorización faltante en callback',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profile = await oauthService.fetchUserProfile(provider, code, redirectUri);
    const result = await oauthService.handleOAuthUser(provider, profile);

    // Si viene de un flujo mobile con deep link
    const isMobileClient = req.query.client === 'mobile';
    if (isMobileClient) {
      const deepLink = `${OAUTH_CONFIG.mobileDeepLinkScheme}?access=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`;
      res.redirect(deepLink);
      return;
    }

    // Si el cliente pide explícitamente JSON (API, tests, herramientas)
    if (req.headers.accept?.includes('application/json')) {
      res.status(200).json({
        data: result,
      });
      return;
    }

    // Si se abrió directamente en un navegador web, guardar credenciales y cargar la app en vez de volcar JSON crudo
    const tokensJson = JSON.stringify(result.tokens);
    const userJson = JSON.stringify(result.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso exitoso — Surf Rental MDP</title>
  <style>
    body {
      background: #090C10;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      text-align: center;
      padding: 32px;
      background: #121824;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 16px;
      max-width: 380px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="font-size: 18px; margin-bottom: 8px;">¡Sesión iniciada con éxito!</h2>
    <p style="font-size: 14px; color: #94A3B8;">Redirigiendo a la plataforma...</p>
  </div>
  <script>
    (function() {
      try {
        var tokens = ${tokensJson};
        var user = ${userJson};
        if (tokens && tokens.accessToken) {
          localStorage.setItem('auth_access_token', tokens.accessToken);
          localStorage.setItem('auth_refresh_token', tokens.refreshToken || '');
          localStorage.setItem('auth_user', JSON.stringify(user));
        }

        var parentWin = window.opener || window.parent;
        if (parentWin && parentWin !== window) {
          try {
            parentWin.postMessage({ type: 'expo-auth-session', url: window.location.href }, '*');
          } catch (e) {}
          setTimeout(function() { window.close(); }, 350);
        } else {
          setTimeout(function() { window.location.href = '/'; }, 300);
        }
      } catch (err) {
        window.location.href = '/';
      }
    })();
  </script>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
};

export const exchangeOAuthToken: RequestHandler = async (req, res, next) => {
  try {
    const provider = req.params.provider?.toLowerCase() as SupportedOAuthProvider;

    if (!validProviders.includes(provider)) {
      res.status(400).json({
        code: 'INVALID_PROVIDER',
        message: 'Proveedor no soportado',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { code, token, profile: customProfile, redirectUri } = req.body;

    const codeOrToken = code || token;
    if (!codeOrToken && !customProfile) {
      res.status(400).json({
        code: 'MISSING_AUTH_CODE',
        message: 'Código de autorización o token faltante en la solicitud',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profile = customProfile
      ? customProfile
      : await oauthService.fetchUserProfile(provider, codeOrToken, redirectUri);

    const result = await oauthService.handleOAuthUser(provider, profile);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const renderConsentScreen: RequestHandler = (req, res) => {
  const provider = (req.params.provider?.toLowerCase() || 'google') as SupportedOAuthProvider;
  const redirectUri = (req.query.redirectUri as string) || `${OAUTH_CONFIG.callbackBaseUrl}/auth/oauth/${provider}/callback`;

  if (provider === 'google') {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceder con Google — Surf Rental MDP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f0f4f9;
      color: #1f1f1f;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .google-card {
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 28px;
      max-width: 440px;
      width: 100%;
      padding: 36px 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .google-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .google-logo {
      width: 32px;
      height: 32px;
    }
    h1 {
      font-size: 22px;
      font-weight: 500;
      color: #1f1f1f;
      line-height: 1.3;
    }
    p.sub {
      color: #444746;
      font-size: 14px;
      margin-top: 4px;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 16px;
      text-align: left;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #444746;
      margin-bottom: 6px;
    }
    .input-field {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #747775;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
      background: #ffffff;
      color: #1f1f1f;
    }
    .input-field:focus {
      border-color: #0b57d0;
      box-shadow: 0 0 0 1px #0b57d0;
    }
    .disclaimer {
      font-size: 12px;
      color: #444746;
      line-height: 1.45;
      margin-top: 20px;
      margin-bottom: 24px;
    }
    .btn-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn-google-primary {
      background: #0b57d0;
      color: #ffffff;
      border: none;
      border-radius: 20px;
      padding: 10px 24px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-google-primary:hover {
      background: #0842a0;
    }
    .btn-google-cancel {
      background: transparent;
      color: #0b57d0;
      border: 1px solid #747775;
      border-radius: 20px;
      padding: 10px 20px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-google-cancel:hover {
      background: #f0f4f9;
    }
    .footer-links {
      margin-top: 24px;
      font-size: 12px;
      color: #747775;
      text-align: center;
      display: flex;
      gap: 16px;
    }
  </style>
</head>
<body>
  <div class="google-card">
    <div class="google-header">
      <svg class="google-logo" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <h1>Acceder con Google</h1>
    </div>
    <p class="sub">para continuar a <strong>Surf Rental Mar del Plata</strong></p>

    <form id="googleForm" onsubmit="handleGoogleSubmit(event)">
      <div class="form-group">
        <label for="googleEmail">Correo electrónico de Google:</label>
        <input type="email" id="googleEmail" class="input-field" placeholder="tunombre@gmail.com" required autofocus>
      </div>

      <div class="form-group">
        <label for="googleName">Nombre completo (opcional):</label>
        <input type="text" id="googleName" class="input-field" placeholder="Tu nombre real">
      </div>

      <p class="disclaimer">
        Para continuar, Google compartirá tu nombre, dirección de correo electrónico y foto de perfil con Surf Rental Mar del Plata.
      </p>

      <div class="btn-actions">
        <button type="button" class="btn-google-cancel" onclick="cancelAuth()">Cancelar</button>
        <button type="submit" class="btn-google-primary">Continuar</button>
      </div>
    </form>
  </div>

  <div class="footer-links">
    <span>Español (Latinoamérica)</span>
    <span>Ayuda</span>
    <span>Privacidad</span>
    <span>Condiciones</span>
  </div>

  <script>
    const redirectUri = "${redirectUri}";
    const provider = "google";

    function handleGoogleSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('googleEmail').value.trim();
      let name = document.getElementById('googleName').value.trim();
      if (!name) {
        name = email.split('@')[0];
      }
      submitAuth(email, name);
    }

    function submitAuth(email, name) {
      const payload = JSON.stringify({ email, name });
      const encoded = btoa(encodeURIComponent(payload));
      const code = 'sandbox-oauth-' + provider + '-' + encoded;
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'code=' + encodeURIComponent(code);
    }

    function cancelAuth() {
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'error=access_denied&error_description=Cancelado+por+el+usuario';
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    return;
  }

  if (provider === 'github') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Surf Rental MDP — GitHub</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .github-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      max-width: 460px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .auth-connection {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    .app-badge {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284C7, #00E5FF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }
    .github-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #21262d;
      border: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .connection-line {
      display: flex;
      align-items: center;
      color: #8b949e;
      font-size: 18px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #f0f6fc;
      text-align: center;
      margin-bottom: 8px;
    }
    p.sub {
      color: #8b949e;
      font-size: 14px;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.4;
    }
    .form-group {
      margin-bottom: 16px;
      text-align: left;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #8b949e;
      margin-bottom: 6px;
    }
    .input-field {
      width: 100%;
      padding: 10px 12px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      font-size: 14px;
      color: #f0f6fc;
      outline: none;
    }
    .input-field:focus {
      border-color: #58a6ff;
    }
    .permissions-list {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .permissions-title {
      font-weight: 600;
      color: #f0f6fc;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .permissions-item {
      color: #8b949e;
      margin-left: 22px;
      margin-top: 4px;
    }
    .btn-github-authorize {
      width: 100%;
      background: #238636;
      border: 1px solid rgba(240, 246, 252, 0.1);
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 10px;
      transition: background 0.15s ease;
    }
    .btn-github-authorize:hover {
      background: #2ea043;
    }
    .btn-github-cancel {
      width: 100%;
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      font-weight: 500;
      font-size: 14px;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="github-card">
    <div class="auth-connection">
      <div class="app-badge">🏄‍♂️</div>
      <div class="connection-line">⟷</div>
      <div class="github-badge">
        <svg height="32" viewBox="0 0 16 16" width="32" fill="#f0f6fc">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </div>
    </div>

    <h1>Authorize Surf Rental MDP</h1>
    <p class="sub">Surf Rental MDP by <strong>surfrental-mdp</strong> wants to access your GitHub account</p>

    <form id="githubForm" onsubmit="handleGithubSubmit(event)">
      <div class="form-group">
        <label for="githubEmail">Usuario o correo de GitHub:</label>
        <input type="text" id="githubEmail" class="input-field" placeholder="username o email" required autofocus>
      </div>

      <div class="form-group">
        <label for="githubName">Nombre completo (opcional):</label>
        <input type="text" id="githubName" class="input-field" placeholder="Nombre completo">
      </div>

      <div class="permissions-list">
        <div class="permissions-title">
          <span>✓</span> Personal user data
        </div>
        <div class="permissions-item">• Email addresses (read-only)</div>
        <div class="permissions-item">• Profile information (read-only)</div>
      </div>

      <button type="submit" class="btn-github-authorize">Authorize surf-rental-mdp</button>
      <button type="button" class="btn-github-cancel" onclick="cancelAuth()">Cancel</button>
    </form>
  </div>

  <script>
    const redirectUri = "${redirectUri}";
    const provider = "github";

    function handleGithubSubmit(e) {
      e.preventDefault();
      const rawInput = document.getElementById('githubEmail').value.trim();
      const email = rawInput.includes('@') ? rawInput : rawInput + '@github.user';
      let name = document.getElementById('githubName').value.trim();
      if (!name) {
        name = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput;
      }
      submitAuth(email, name);
    }

    function submitAuth(email, name) {
      const payload = JSON.stringify({ email, name });
      const encoded = btoa(encodeURIComponent(payload));
      const code = 'sandbox-oauth-' + provider + '-' + encoded;
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'code=' + encodeURIComponent(code);
    }

    function cancelAuth() {
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'error=access_denied&error_description=Cancelado+por+el+usuario';
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    return;
  }

  // Fallback para otros proveedores (Facebook, Apple)
  const providerNames: Record<SupportedOAuthProvider, string> = {
    google: 'Google',
    github: 'GitHub',
    facebook: 'Facebook',
    apple: 'Apple',
  };

  const name = providerNames[provider] || provider;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso con ${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090C10;
      color: #F1F5F9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #121824;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 16px;
      max-width: 440px;
      width: 100%;
      padding: 32px 24px;
      text-align: center;
    }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p.sub { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
    .form-group { text-align: left; margin-bottom: 16px; }
    label { display: block; font-size: 12px; color: #94A3B8; margin-bottom: 6px; }
    input { width: 100%; padding: 12px; background: #0B111D; border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
    .btn-submit { width: 100%; padding: 12px; background: #0284C7; color: #FFFFFF; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 10px; }
    .btn-cancel { width: 100%; padding: 10px; background: transparent; color: #94A3B8; border: 1px solid rgba(148,163,184,0.2); border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Iniciar sesión con ${name}</h1>
    <p class="sub">Surf Rental MDP solicita acceso para autenticar tu cuenta.</p>
    <form id="genericForm" onsubmit="handleGenericSubmit(event)">
      <div class="form-group">
        <label for="genericEmail">Correo electrónico:</label>
        <input type="email" id="genericEmail" required placeholder="tu-email@ejemplo.com">
      </div>
      <div class="form-group">
        <label for="genericName">Nombre completo (opcional):</label>
        <input type="text" id="genericName" placeholder="Tu nombre">
      </div>
      <button type="submit" class="btn-submit">Autorizar</button>
      <button type="button" class="btn-cancel" onclick="cancelAuth()">Cancelar</button>
    </form>
  </div>
  <script>
    const redirectUri = "${redirectUri}";
    const provider = "${provider}";

    function handleGenericSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('genericEmail').value.trim();
      let name = document.getElementById('genericName').value.trim();
      if (!name) name = email.split('@')[0];
      const payload = JSON.stringify({ email, name });
      const encoded = btoa(encodeURIComponent(payload));
      const code = 'sandbox-oauth-' + provider + '-' + encoded;
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'code=' + encodeURIComponent(code);
    }

    function cancelAuth() {
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'error=access_denied&error_description=Cancelado+por+el+usuario';
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
};
