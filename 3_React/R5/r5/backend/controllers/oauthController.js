const jwt = require('jsonwebtoken');
const { passport, enabled } = require('../config/passport');

const allowedOrigins = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim());
const safeOrigin = (candidate) => (allowedOrigins().includes(candidate) ? candidate : allowedOrigins()[0]);

const notConfigured = (res, p) =>
  res.status(503).json({
    message: `El login con "${p}" no está configurado. Completá ${p.toUpperCase()}_CLIENT_ID y ${p.toUpperCase()}_CLIENT_SECRET en backend/.env para habilitarlo.`,
  });

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

// GET /api/auth/:provider?redirect=<origen del frontend>
// Redirección directa hacia el proveedor oficial externo (Google, GitHub, Discord)
exports.start = (req, res, next) => {
  const p = req.params.provider;
  if (!['google', 'github', 'discord'].includes(p)) {
    return notConfigured(res, p);
  }

  if (!enabled[p]) {
    return notConfigured(res, p);
  }

  const origin = safeOrigin(req.query.redirect);
  const state = Buffer.from(origin).toString('base64url');

  const opts = { session: false, scope: enabled[p].scope, state };
  if (p === 'google') {
    // Hace que Google SIEMPRE muestre la pantalla "Elige una cuenta" (para seleccionar cuenta de Gmail)
    opts.prompt = 'select_account';
  } else if (p === 'discord') {
    opts.prompt = 'consent';
  } else if (p === 'github') {
    // Hace que GitHub SIEMPRE muestre el selector de cuenta en vez de auto-logear
    opts.prompt = 'select_account';
  }

  return passport.authenticate(p, opts)(req, res, next);
};

// GET /api/auth/:provider/callback
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
    // El token va en el fragmento (#): seguro, no viaja al servidor ni queda en logs.
    res.redirect(`${origin}/oauth/callback#token=${token}`);
  })(req, res, next);
};
