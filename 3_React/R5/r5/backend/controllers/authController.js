const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { publicUser } = require('../models/userModel');

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const EMAIL_RE = /^\S+@\S+\.\S+$/;

exports.register = (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'El email no es válido.' });
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
    return res.status(409).json({ message: 'El email ya está registrado.' });
  }

  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(String(name).trim().slice(0, 80), cleanEmail, bcrypt.hashSync(password, 10));

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user.id) });
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }
  res.json({ token: signToken(user), user: publicUser(user.id) });
};

exports.me = (req, res) => {
  const user = publicUser(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
  res.json({ user });
};
