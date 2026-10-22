const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const db = require('../config/db');

router.use(auth);

const map = (t) => ({ id: t.id, title: t.title, done: !!t.done, createdAt: t.created_at });
const own = (id, userId) => db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json({ tasks: rows.map(map) });
});

router.post('/', (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ message: 'El título es obligatorio.' });
  if (title.length > 200) return res.status(400).json({ message: 'Máximo 200 caracteres.' });
  const info = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)').run(req.user.id, title);
  res.status(201).json({ task: map(own(info.lastInsertRowid, req.user.id)) });
});

router.patch('/:id', (req, res) => {
  const t = own(req.params.id, req.user.id);
  if (!t) return res.status(404).json({ message: 'Tarea no encontrada.' });
  const title = req.body?.title !== undefined ? String(req.body.title).trim() : t.title;
  if (!title || title.length > 200) return res.status(400).json({ message: 'Título inválido.' });
  const done = req.body?.done !== undefined ? (req.body.done ? 1 : 0) : t.done;
  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, t.id);
  res.json({ task: map(own(t.id, req.user.id)) });
});

router.delete('/:id', (req, res) => {
  const t = own(req.params.id, req.user.id);
  if (!t) return res.status(404).json({ message: 'Tarea no encontrada.' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(t.id);
  res.json({ ok: true });
});

module.exports = router;
