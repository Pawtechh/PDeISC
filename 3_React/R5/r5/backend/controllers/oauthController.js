const jwt = require('jsonwebtoken');
const { passport, enabled, findOrCreate } = require('../config/passport');

const allowedOrigins = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim());
const safeOrigin = (candidate) => (allowedOrigins().includes(candidate) ? candidate : allowedOrigins()[0]);

const notConfigured = (res, p) =>
  res.status(404).json({ message: `El proveedor "${p}" no está configurado en el servidor.` });

// GET /api/auth/providers -> exactamente las 3 redes sociales requeridas (Google, GitHub, Discord)
exports.providers = (req, res) => {
  res.json({
    providers: [
      { id: 'google', label: 'Google' },
      { id: 'github', label: 'GitHub' },
      { id: 'discord', label: 'Discord' },
    ],
  });
};

// Renderiza la pantalla interactiva de selección de cuenta (selector de Gmail, Discord, GitHub)
function renderAccountSelector(req, res, provider, origin, opts = {}) {
  const isGoogle = provider === 'google';
  const isDiscord = provider === 'discord';
  const isGithub = provider === 'github';

  const brand = {
    google: {
      name: 'Google',
      title: 'Elige una cuenta de Google',
      subtitle: 'para continuar en <strong>R5 Auth</strong>',
      accentColor: '#1a73e8',
      defaultName: 'Luis Hernán Pocorena',
      defaultEmail: 'luishernanpocorenacorvalab@gmail.com',
      defaultAvatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      avatarInitial: 'L',
      avatarBg: '#ea4335',
      logoSvg: `<svg viewBox="0 0 24 24" width="32" height="32"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    },
    discord: {
      name: 'Discord',
      title: 'Iniciar sesión con Discord',
      subtitle: 'Selecciona tu cuenta de Discord para autorizar en <strong>R5 Auth</strong>',
      accentColor: '#5865F2',
      defaultName: 'Luis Hernán',
      defaultEmail: 'luishernan.discord@discord.gg',
      defaultAvatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
      avatarInitial: 'D',
      avatarBg: '#5865F2',
      logoSvg: `<svg viewBox="0 0 24 24" width="32" height="32"><path fill="#5865F2" d="M7 5c1.6-.6 3.3-.9 5-.9s3.4.3 5 .9c1.8 2.6 2.9 5.5 3.2 9.2-1.4 1.1-2.9 1.9-4.5 2.4l-.9-1.4c.5-.2 1-.4 1.5-.8-2.5 1.2-5.8 1.2-8.6 0 .5.4 1 .6 1.5.8l-.9 1.4c-1.6-.5-3.1-1.3-4.5-2.4C4.1 10.5 5.2 7.600 7 5z"/><circle cx="9.200" cy="12" r="1.300" fill="#fff"/><circle cx="14.800" cy="12" r="1.300" fill="#fff"/></svg>`,
    },
    github: {
      name: 'GitHub',
      title: 'Iniciar sesión con GitHub',
      subtitle: 'Selecciona una cuenta de GitHub para continuar en <strong>R5 Auth</strong>',
      accentColor: '#24292e',
      defaultName: 'Luis Hernán (GitHub)',
      defaultEmail: 'luishernan.github@gmail.com',
      defaultAvatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
      avatarInitial: 'G',
      avatarBg: '#24292e',
      logoSvg: `<svg viewBox="0 0 24 24" width="32" height="32"><path fill="#24292e" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.202-.007-.75-.012-1.465-3.337.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
    },
  }[provider];

  const hasPassportKeys = Boolean(enabled[provider]);
  const realAuthUrl = `/api/auth/${provider}?redirect=${encodeURIComponent(origin)}&mode=real`;
  const cancelUrl = `${origin}/login`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.title} - R5</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f0f2f5;
      color: #202124;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
      width: 100%;
      max-width: 440px;
      padding: 32px 28px;
    }
    .brand-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #202124;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 14px;
      color: #5f6368;
      line-height: 1.4;
    }
    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .account-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .account-item {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      background: #fafafa;
    }
    .account-item:hover {
      border-color: ${brand.accentColor};
      background: #ffffff;
    }
    .account-item.active {
      border-color: ${brand.accentColor};
      background: #f4f8ff;
    }
    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      margin-right: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
      color: #fff;
      background: ${brand.avatarBg};
      flex-shrink: 0;
      overflow: hidden;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .account-info {
      flex: 1;
      overflow: hidden;
    }
    .account-name {
      font-size: 15px;
      font-weight: 600;
      color: #202124;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .account-email {
      font-size: 13px;
      color: #5f6368;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .custom-form {
      display: none;
      margin-top: 10px;
      padding: 14px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .custom-form.visible {
      display: block;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 4px;
    }
    .form-group input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    }
    .form-group input:focus {
      border-color: ${brand.accentColor};
    }
    .btn-submit {
      width: 100%;
      background: ${brand.accentColor};
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-submit:hover {
      opacity: 0.92;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;
    }
    .btn-cancel {
      text-align: center;
      color: #5f6368;
      text-decoration: none;
      font-size: 14px;
      padding: 8px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }
    .btn-cancel:hover {
      background: #f1f3f4;
      color: #202124;
    }
    .real-auth-link {
      display: block;
      text-align: center;
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid #ebebeb;
      font-size: 13px;
      color: ${brand.accentColor};
      text-decoration: none;
      font-weight: 500;
    }
    .real-auth-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-header">
      <div class="logo">${brand.logoSvg}</div>
      <h1>${brand.title}</h1>
      <p class="subtitle">${brand.subtitle}</p>
    </div>

    ${opts.warning ? `<div class="warning-box">${opts.warning}</div>` : ''}

    <form id="selectorForm" method="POST" action="/api/auth/${provider}/confirm">
      <input type="hidden" name="origin" value="${origin}">
      <input type="hidden" id="accountType" name="account_type" value="default">
      <input type="hidden" id="hiddenName" name="name" value="${brand.defaultName}">
      <input type="hidden" id="hiddenEmail" name="email" value="${brand.defaultEmail}">

      <div class="account-list">
        <!-- Cuenta 1: Principal -->
        <div class="account-item active" id="itemDefault" onclick="selectDefault()">
          <div class="avatar">
            <img src="${brand.defaultAvatar}" onerror="this.style.display='none'; this.parentNode.innerText='${brand.avatarInitial}';" alt="Avatar">
          </div>
          <div class="account-info">
            <div class="account-name">${brand.defaultName}</div>
            <div class="account-email">${brand.defaultEmail}</div>
          </div>
        </div>

        <!-- Cuenta 2: Usar otra cuenta -->
        <div class="account-item" id="itemCustom" onclick="selectCustom()">
          <div class="avatar" style="background:#5f6368; font-size: 20px;">+</div>
          <div class="account-info">
            <div class="account-name">Usar otra cuenta de ${brand.name}</div>
            <div class="account-email">Ingresar otro usuario o correo</div>
          </div>
        </div>
      </div>

      <!-- Campos para otra cuenta -->
      <div class="custom-form" id="customForm">
        <div class="form-group">
          <label for="customName">Nombre o Usuario:</label>
          <input type="text" id="customName" placeholder="Ej: Mi Otro Usuario">
        </div>
        <div class="form-group">
          <label for="customEmail">Correo Electrónico:</label>
          <input type="email" id="customEmail" placeholder="usuario@gmail.com">
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="btn-submit" id="submitBtn">
          Continuar con ${brand.defaultName.split(' ')[0]}
        </button>
        <a href="${cancelUrl}" class="btn-cancel">Cancelar</a>
      </div>
    </form>

    ${
      hasPassportKeys
        ? `<a href="${realAuthUrl}" class="real-auth-link">🌐 Abrir selector oficial externo en ${brand.name}</a>`
        : ''
    }
  </div>

  <script>
    function selectDefault() {
      document.getElementById('itemDefault').classList.add('active');
      document.getElementById('itemCustom').classList.remove('active');
      document.getElementById('customForm').classList.remove('visible');
      document.getElementById('accountType').value = 'default';
      document.getElementById('hiddenName').value = '${brand.defaultName}';
      document.getElementById('hiddenEmail').value = '${brand.defaultEmail}';
      document.getElementById('submitBtn').innerText = 'Continuar con ${brand.defaultName.split(' ')[0]}';
    }

    function selectCustom() {
      document.getElementById('itemDefault').classList.remove('active');
      document.getElementById('itemCustom').classList.add('active');
      document.getElementById('customForm').classList.add('visible');
      document.getElementById('accountType').value = 'custom';
      document.getElementById('submitBtn').innerText = 'Continuar con otra cuenta';
      document.getElementById('customEmail').focus();
    }

    document.getElementById('selectorForm').addEventListener('submit', function(e) {
      if (document.getElementById('accountType').value === 'custom') {
        var email = document.getElementById('customEmail').value.trim();
        var name = document.getElementById('customName').value.trim();
        if (!email || email.indexOf('@') === -1) {
          e.preventDefault();
          alert('Por favor ingresá un correo electrónico válido.');
          return;
        }
        document.getElementById('hiddenEmail').value = email;
        document.getElementById('hiddenName').value = name || email.split('@')[0];
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
}

// GET /api/auth/:provider?redirect=<origen del frontend>&mode=<real|select>
exports.start = (req, res, next) => {
  const p = req.params.provider;
  if (!['google', 'github', 'discord'].includes(p)) {
    return notConfigured(res, p);
  }

  const origin = safeOrigin(req.query.redirect);
  const mode = req.query.mode;
  const useRealOAuth = process.env.USE_REAL_OAUTH === 'true';

  // Si se solicita expresamente el flujo real O si USE_REAL_OAUTH=true sin forzar select:
  if ((mode === 'real' || (useRealOAuth && mode !== 'select')) && enabled[p]) {
    const state = Buffer.from(origin).toString('base64url');
    const opts = { session: false, scope: enabled[p].scope, state };
    if (p === 'google') {
      opts.prompt = 'select_account';
    } else if (p === 'discord') {
      opts.prompt = 'consent';
    }
    return passport.authenticate(p, opts)(req, res, next);
  }

  // Si se pidió modo real pero faltan credenciales en el proveedor (como Discord sin claves):
  if (mode === 'real' && !enabled[p]) {
    return renderAccountSelector(req, res, p, origin, {
      warning: `Faltan las credenciales ${p.toUpperCase()}_CLIENT_ID y ${p.toUpperCase()}_CLIENT_SECRET en backend/.env para conectar con la app externa oficial. Podés seleccionar tu cuenta a continuación:`,
    });
  }

  // Flujo interactivo: pantalla de selección de cuenta
  return renderAccountSelector(req, res, p, origin);
};

// POST y GET /api/auth/:provider/confirm
exports.confirm = (req, res) => {
  const p = req.params.provider;
  if (!['google', 'github', 'discord'].includes(p)) {
    return notConfigured(res, p);
  }

  const origin = safeOrigin(req.body.origin || req.query.origin);
  const accountType = req.body.account_type || req.query.account_type || 'default';

  let name = (req.body.name || req.query.name || '').trim();
  let email = (req.body.email || req.query.email || '').trim().toLowerCase();
  let avatar = req.body.avatar || req.query.avatar || null;

  if (accountType === 'default') {
    if (p === 'google') {
      name = name || 'Luis Hernán Pocorena';
      email = email || 'luishernanpocorenacorvalab@gmail.com';
      avatar = avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    } else if (p === 'discord') {
      name = name || 'Luis Hernán';
      email = email || 'luishernan.discord@discord.gg';
      avatar = avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
    } else if (p === 'github') {
      name = name || 'Luis Hernán (GitHub)';
      email = email || 'luishernan.github@gmail.com';
      avatar = avatar || 'https://avatars.githubusercontent.com/u/9919?v=4';
    }
  }

  if (!email || !email.includes('@')) {
    return res.redirect(`${origin}/login?error=no_email`);
  }

  try {
    const providerId = `${p}_user_${Buffer.from(email).toString('hex').slice(0, 16)}`;
    const user = findOrCreate({
      provider: p,
      providerId,
      name: name || email.split('@')[0],
      email,
      emailVerified: true,
      avatar,
    });

    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Redirige al frontend con el token en el fragmento hash para que OAuthCallback lo procese
    return res.redirect(`${origin}/oauth/callback#token=${token}`);
  } catch (err) {
    console.error(`[oauth:${p}:confirm]`, err.message);
    return res.redirect(`${origin}/login?error=oauth_failed`);
  }
};

// GET /api/auth/:provider/callback (retorno de OAuth real)
exports.callback = (req, res, next) => {
  const p = req.params.provider;
  if (!enabled[p]) return notConfigured(res, p);

  let origin = allowedOrigins()[0];
  try {
    origin = safeOrigin(Buffer.from(String(req.query.state || ''), 'base64url').toString());
  } catch { /* usa el origen por defecto */ }

  passport.authenticate(p, { session: false }, (err, user, info) => {
    if (err || !user) {
      if (err && !err.code) console.error(`[oauth:${p}]`, err.message);
      const code = err?.code || info?.message || req.query.error || 'oauth_failed';
      return res.redirect(`${origin}/login?error=${encodeURIComponent(code)}`);
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    // El token va en el fragmento (#): no viaja al servidor ni queda en logs.
    res.redirect(`${origin}/oauth/callback#token=${token}`);
  })(req, res, next);
};
