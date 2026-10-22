const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

router.get('/me', authMiddleware, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
  res.json({ user });
});

module.exports = router;
