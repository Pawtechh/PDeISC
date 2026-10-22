const router = require('express').Router();
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');
const { publicUser } = require('../models/userModel');

router.use(authMiddleware);

router.get('/me', (req, res) => {
  const user = publicUser(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
  res.json({ user });
});

// Alias usado por la documentación original
router.get('/profile', (req, res) => {
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

// Cambiar contraseña (o crearla, si la cuenta se registró solo con login social)
router.put('/me/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!u) return res.status(404).json({ message: 'Usuario no encontrado.' });
  if (u.password_hash) {
    if (!currentPassword) return res.status(400).json({ message: 'Ingresá tu contraseña actual.' });
    if (!bcrypt.compareSync(currentPassword, u.password_hash)) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }
  }
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ ok: true });
});

module.exports = router;
