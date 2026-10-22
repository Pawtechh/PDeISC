const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

const PORT = process.env.PORT || 4000;
const callbackFor = (id) =>
  process.env[`${id.toUpperCase()}_CALLBACK_URL`] || `http://localhost:${PORT}/api/auth/${id}/callback`;

// Proveedores realmente configurados (los que tienen CLIENT_ID y CLIENT_SECRET en .env)
const enabled = {};

function findOrCreate({ provider, providerId, email, emailVerified, name, avatar }) {
  const pid = String(providerId);
  const linked = db
    .prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?')
    .get(provider, pid);

  if (linked) {
    if (avatar) db.prepare('UPDATE users SET avatar_url = COALESCE(avatar_url, ?) WHERE id = ?').run(avatar, linked.user_id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(linked.user_id);
  }

  email = (email || '').toLowerCase().trim();
  if (!email) {
    const err = new Error('No se pudo obtener el email del proveedor.');
    err.code = 'no_email';
    throw err;
  }
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Solo se vincula a una cuenta existente si el proveedor confirma que el email es del usuario.
  if (user && !emailVerified) {
    const err = new Error('El email ya existe y el proveedor no lo verificó.');
    err.code = 'email_in_use';
    throw err;
  }

  if (!user) {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, avatar_url) VALUES (?, ?, NULL, ?)')
      .run(name || email.split('@')[0], email, avatar || null);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  } else if (avatar) {
    db.prepare('UPDATE users SET avatar_url = COALESCE(avatar_url, ?) WHERE id = ?').run(avatar, user.id);
  }

  db.prepare('INSERT OR IGNORE INTO oauth_accounts (user_id, provider, provider_id) VALUES (?, ?, ?)').run(user.id, provider, pid);
  return user;
}

function use(id, label, Strategy, scope, map, extraOpts = {}) {
  const K = id.toUpperCase();
  const clientID = process.env[`${K}_CLIENT_ID`];
  const clientSecret = process.env[`${K}_CLIENT_SECRET`];
  if (!clientID || !clientSecret) {
    console.log(`[passport] ${label}: sin configurar (falta ${K}_CLIENT_ID / ${K}_CLIENT_SECRET)`);
    return;
  }
  passport.use(
    new Strategy(
      { clientID, clientSecret, callbackURL: callbackFor(id), scope, ...extraOpts },
      (at, rt, profile, done) => {
        try {
          const data = map(profile);
          if (!data.email) return done(null, false, { message: 'no_email' });
          done(null, findOrCreate({ provider: id, ...data }));
        } catch (err) {
          done(err);
        }
      }
    )
  );
  enabled[id] = { label, scope };
  console.log(`[passport] ${label}: OK`);
}

use('google', 'Google', GoogleStrategy, ['profile', 'email'], (p) => ({
  providerId: p.id,
  email: p.emails?.[0]?.value || p._json?.email,
  emailVerified: p._json?.email_verified === true || p.emails?.[0]?.verified === true,
  name: p.displayName || p._json?.name || 'Usuario Google',
  avatar: p.photos?.[0]?.value || p._json?.picture,
}));

use(
  'github',
  'GitHub',
  GitHubStrategy,
  ['user:email'],
  (p) => {
    const list = p.emails || [];
    const good = list.find((e) => e.verified && e.primary) || list.find((e) => e.verified) || list[0];
    const emailVal = good?.value || (typeof good === 'string' ? good : null) || p._json?.email || `${p.id}+${p.username}@users.noreply.github.com`;
    return {
      providerId: p.id,
      email: emailVal,
      emailVerified: Boolean(good?.verified ?? (good?.value || p._json?.email)),
      name: p.displayName || p.username || 'Usuario GitHub',
      avatar: p.photos?.[0]?.value || p._json?.avatar_url,
    };
  },
  { allRawEmails: true }
);

use('discord', 'Discord', DiscordStrategy, ['identify', 'email'], (p) => ({
  providerId: p.id,
  email: p.email || `${p.id}+${p.username}@discord.gg`,
  emailVerified: p.verified === true,
  name: p.global_name || p.username || 'Usuario Discord',
  avatar: p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null,
}));

use(
  'facebook',
  'Facebook',
  FacebookStrategy,
  ['email', 'public_profile'],
  (p) => ({
    providerId: p.id,
    email: p.emails?.[0]?.value || `${p.id}@facebook.com`,
    emailVerified: Boolean(p.emails?.[0]?.value),
    name: p.displayName || `${p.name?.givenName || ''} ${p.name?.familyName || ''}`.trim() || 'Usuario Facebook',
    avatar: p.photos?.[0]?.value || `https://graph.facebook.com/${p.id}/picture?type=large`,
  }),
  { profileFields: ['id', 'displayName', 'name', 'photos', 'email'] }
);

module.exports = { passport, enabled, findOrCreate };
