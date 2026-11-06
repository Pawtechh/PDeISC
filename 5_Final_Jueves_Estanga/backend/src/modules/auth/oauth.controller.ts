import { RequestHandler } from 'express';
import { oauthService } from './oauth.service';
import { SupportedOAuthProvider, OAUTH_CONFIG } from '../../config/oauth';

const validProviders: SupportedOAuthProvider[] = ['google', 'github', 'facebook', 'apple', 'instagram'];

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
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() || req.get('host');
    const dynamicBaseUrl = host ? `${proto}://${host}/api` : undefined;
    const authUrl = oauthService.getAuthorizationUrl(provider, redirectUri, dynamicBaseUrl);

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
          localStorage.setItem('surf_access_token', tokens.accessToken);
          localStorage.setItem('surf_refresh_token', tokens.refreshToken || '');
          localStorage.setItem('surf_user_session', JSON.stringify(user));
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

export const listGoogleAccounts: RequestHandler = async (_req, res, next) => {
  try {
    const accounts = await oauthService.listGoogleAccounts();
    res.status(200).json({
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

export const renderConsentScreen: RequestHandler = async (req, res) => {
  const provider = (req.params.provider?.toLowerCase() || 'google') as SupportedOAuthProvider;
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() || req.get('host');
  const dynamicBaseUrl = host ? `${proto}://${host}/api` : OAUTH_CONFIG.callbackBaseUrl;
  const redirectUri = (req.query.redirectUri as string) || `${dynamicBaseUrl}/auth/oauth/${provider}/callback`;

  if (provider === 'google') {
    const dbAccounts = await oauthService.listGoogleAccounts();
    const avatarColors = ['#78909C', '#E57373', '#0097A7', '#F4511E', '#E64A19', '#5C6BC0', '#00897B'];
    const accountsHtml = dbAccounts
      .map((acc, idx) => {
        const initial = (acc.nombre || acc.email || 'G').trim().charAt(0).toUpperCase();
        const color = avatarColors[idx % avatarColors.length];
        const safeEmail = acc.email.replace(/"/g, '&quot;');
        const safeName = (acc.nombre || acc.email.split('@')[0] || 'Usuario').replace(/"/g, '&quot;');
        return `
        <div class="account-item" onclick="submitAuth('${safeEmail}', '${safeName}')">
          <div class="avatar" style="background:${color}">${initial}</div>
          <div class="account-info">
            <div class="account-name">${safeName}</div>
            <div class="account-email">${safeEmail}</div>
          </div>
        </div>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceder con Google — Surf Rental Mar del Plata</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Google Sans", Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      background: #1e1f20;
      color: #e3e3e3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .google-dialog {
      background: #0e0e0e;
      border-radius: 28px;
      max-width: 820px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0,0,0,0.55);
      border: 1px solid #303134;
    }
    .dialog-topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      border-bottom: 1px solid #3c4043;
      font-size: 14px;
      color: #e3e3e3;
    }
    .dialog-body {
      display: flex;
      flex-wrap: wrap;
      padding: 36px 40px 44px;
      gap: 36px;
    }
    .col-left {
      flex: 1 1 260px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .app-badge {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0d1826;
      border: 1px solid rgba(0, 229, 255, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .col-left h1 {
      font-size: 32px;
      font-weight: 400;
      color: #e3e3e3;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .col-left p {
      font-size: 16px;
      color: #e3e3e3;
    }
    .col-left p span {
      color: #8ab4f8;
      font-weight: 500;
    }
    .col-right {
      flex: 1.2 1 320px;
      display: flex;
      flex-direction: column;
    }
    .account-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 12px;
      border-bottom: 1px solid #3c4043;
      cursor: pointer;
      transition: background 0.15s ease;
      border-radius: 8px;
    }
    .account-item:hover {
      background: rgba(255,255,255,0.06);
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 500;
      color: #ffffff;
      flex-shrink: 0;
    }
    .account-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .account-name {
      font-size: 14px;
      font-weight: 500;
      color: #e3e3e3;
    }
    .account-email {
      font-size: 12px;
      color: #9aa0a6;
      margin-top: 2px;
    }
    .use-another {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 12px;
      border-bottom: 1px solid #3c4043;
      cursor: pointer;
      border-radius: 8px;
      color: #e3e3e3;
      font-size: 14px;
      font-weight: 500;
    }
    .use-another:hover {
      background: rgba(255,255,255,0.06);
    }
    #customForm {
      display: none;
      flex-direction: column;
      gap: 16px;
      padding-top: 4px;
    }
    .input-field {
      width: 100%;
      padding: 14px 16px;
      background: transparent;
      border: 1px solid #8e918f;
      border-radius: 4px;
      color: #e3e3e3;
      font-size: 15px;
      outline: none;
    }
    .input-field:focus {
      border-color: #8ab4f8;
      box-shadow: 0 0 0 1px #8ab4f8;
    }
    .btn-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    .btn-link {
      background: transparent;
      border: none;
      color: #8ab4f8;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 18px;
    }
    .btn-next {
      background: #8ab4f8;
      color: #062e6f;
      border: none;
      border-radius: 20px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="google-dialog">
    <div class="dialog-topbar">
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span>Acceder con Google</span>
    </div>
    <div class="dialog-body">
      <div class="col-left">
        <div class="app-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          </svg>
        </div>
        <h1 id="leftTitle">Elige una cuenta</h1>
        <p>Ir a <span>Surf Rental Mar del Plata</span></p>
      </div>
      <div class="col-right">
        <div id="accountList">
          ${accountsHtml}
          <div class="use-another" onclick="showCustomForm()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e3e3e3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px;margin-right:6px;">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="10" r="3"/>
              <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
            </svg>
            <span>Usar otra cuenta</span>
          </div>
        </div>
        <form id="customForm" onsubmit="handleGoogleSubmit(event)">
          <input type="email" id="googleEmail" class="input-field" placeholder="Correo electrónico o teléfono" required>
          <input type="text" id="googleName" class="input-field" placeholder="Nombre y apellido">
          <div class="btn-row">
            <button type="button" class="btn-link" onclick="showAccountList()">Volver a las cuentas</button>
            <button type="submit" class="btn-next">Siguiente</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <script>
    const redirectUri = "${redirectUri}";
    const provider = "google";
    function showCustomForm() {
      document.getElementById('accountList').style.display = 'none';
      document.getElementById('customForm').style.display = 'flex';
      document.getElementById('leftTitle').textContent = 'Acceder';
      document.getElementById('googleEmail').focus();
    }
    function showAccountList() {
      document.getElementById('customForm').style.display = 'none';
      document.getElementById('accountList').style.display = 'block';
      document.getElementById('leftTitle').textContent = 'Elige una cuenta';
    }
    function handleGoogleSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('googleEmail').value.trim();
      let name = document.getElementById('googleName').value.trim();
      if (!name) name = email.split('@')[0];
      submitAuth(email, name);
    }
    function submitAuth(email, name) {
      const payload = JSON.stringify({ email, name });
      const encoded = btoa(encodeURIComponent(payload));
      const code = 'sandbox-oauth-' + provider + '-' + encoded;
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + delimiter + 'code=' + encodeURIComponent(code);
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
    instagram: 'Instagram',
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
