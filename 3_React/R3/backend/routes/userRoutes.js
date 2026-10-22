const router = require('express').Router();
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

router.use(authMiddleware);

const publicUser = (id) =>
  db.prepare('SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?').get(id);

router.get('/me', (req, res) => {
  const user = publicUser(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
  res.json({ user });
});

// Editar nombre
router.put('/me', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'El nombre es obligatorio.' });
  if (name.length > 80) return res.status(400).json({ message: 'Máximo 80 caracteres.' });
  db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, req.user.id);
  res.json({ user: publicUser(req.user.id) });
});

// Cambiar contraseña
router.put('/me/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Completá ambas contraseñas.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!u || !bcrypt.compareSync(currentPassword, u.password_hash)) {
    return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
  }
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ ok: true });
});

module.exports = router;
