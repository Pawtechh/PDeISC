// Acceso a datos de usuarios (SQLite). Un único lugar donde se arma el usuario "público".
const db = require('../config/db');

exports.publicUser = (id) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!u) return null;
  const providers = db
    .prepare('SELECT provider FROM oauth_accounts WHERE user_id = ?')
    .all(id)
    .map((r) => r.provider);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at,
    hasPassword: !!u.password_hash,
    providers,
  };
};
