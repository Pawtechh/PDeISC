// setup.js — genera todos los archivos del proyecto
const fs = require('fs');
const path = require('path');
const root = __dirname;

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('OK  ' + rel);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function del(rel) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) { fs.unlinkSync(full); console.log('DEL ' + rel); }
}

// ---------- Borrar archivos viejos ----------
[
  'backend/config/passport.js',
  'backend/routes/oauthRoutes.js',
  'frontend-v2-usestate/src/components/Login.jsx',
  'frontend-v2-usestate/src/components/Register.jsx',
  'frontend-v2-usestate/src/components/Dashboard.jsx',
].forEach(del);

// ==================== BACKEND ====================

write('backend/package.json', `{
  "name": "auth-backend",
  "version": "1.0.0",
  "description": "Backend de autenticación con Express + SQLite + JWT",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^11.3.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
`);

const backendEnv = `PORT=4000
CLIENT_URL=http://localhost:5173,http://localhost:5174

DB_PATH=./data/auth.db

JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=7d
`;
write('backend/.env.example', backendEnv);
write('backend/.env', backendEnv);

write('backend/.gitignore', `node_modules/
.env
data/
*.log
`);

write('backend/config/db.js', `const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'auth.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
\`);

module.exports = db;
`);

write('backend/middleware/authMiddleware.js', `const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No autorizado. Token faltante.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};
`);

write('backend/controllers/authController.js', `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitize = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: u.created_at,
});

exports.register = (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ message: 'El email ya está registrado.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), cleanEmail, passwordHash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: sanitize(user) });
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  res.json({ token: signToken(user), user: sanitize(user) });
};

exports.me = (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
  res.json({ user: sanitize(user) });
};
`);

write('backend/routes/authRoutes.js', `const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.get ('/me',       authMiddleware, authController.me);

module.exports = router;
`);

write('backend/routes/userRoutes.js', `const router = require('express').Router();
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
`);

write('backend/server.js', `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || '*').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados intentos. Intenta nuevamente más tarde.' },
});
app.use('/api/auth', authLimiter);

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(\`✅ Servidor corriendo en http://localhost:\${PORT}\`);
});
`);

// ==================== FRONTEND v1 ====================

write('frontend-v1-router/package.json', `{
  "name": "frontend-v1-router",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.0",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1"
  }
}
`);

const feEnv = 'VITE_API_URL=http://localhost:4000/api\n';
write('frontend-v1-router/.env.example', feEnv);
write('frontend-v1-router/.env', feEnv);

write('frontend-v1-router/vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
`);

write('frontend-v1-router/index.html', `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Auth App - Versión Router (v1)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

write('frontend-v1-router/src/main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
`);

write('frontend-v1-router/src/api/axios.js', `import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export default api;
`);

write('frontend-v1-router/src/context/AuthContext.jsx', `import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`);

write('frontend-v1-router/src/components/ProtectedRoute.jsx', `import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
`);

write('frontend-v1-router/src/App.jsx', `import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
      <Link to="/">Inicio</Link>
      {!user && <Link to="/login">Login</Link>}
      {!user && <Link to="/register">Registro</Link>}
      {user && <Link to="/dashboard">Dashboard</Link>}
      {user && (
        <button onClick={() => { logout(); navigate('/login'); }}>
          Cerrar sesión
        </button>
      )}
      <span style={{ marginLeft: 'auto' }}>{user ? \`👤 \${user.email}\` : 'Invitado'} · <em>v1</em></span>
    </nav>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Nav />
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<h1>Bienvenido {user ? user.name : 'a la Auth App v1'}</h1>} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<p>404 – No encontrado</p>} />
        </Routes>
      </main>
    </>
  );
}
`);

write('frontend-v1-router/src/pages/Login.jsx', `import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Iniciar sesión (v1)</h2>
      {serverError && <p style={{ color: 'red' }}>{serverError}</p>}

      <label>Email</label>
      <input
        type="email"
        {...register('email', { required: 'Email obligatorio' })}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}

      <label>Contraseña</label>
      <input
        type="password"
        {...register('password', { required: 'Contraseña obligatoria' })}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>

      <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </form>
  );
}
`);

write('frontend-v1-router/src/pages/Register.jsx', `import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await signup(values.name, values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al registrarse.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Crear cuenta (v1)</h2>
      {serverError && <p style={{ color: 'red' }}>{serverError}</p>}

      <label>Nombre</label>
      <input
        {...register('name', { required: 'Nombre obligatorio' })}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errors.name && <p style={{ color: 'red' }}>{errors.name.message}</p>}

      <label>Email</label>
      <input
        type="email"
        {...register('email', { required: 'Email obligatorio' })}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}

      <label>Contraseña</label>
      <input
        type="password"
        {...register('password', {
          required: 'Contraseña obligatoria',
          minLength: { value: 6, message: 'Mínimo 6 caracteres' },
        })}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Creando…' : 'Registrarse'}
      </button>

      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </form>
  );
}
`);

write('frontend-v1-router/src/pages/Dashboard.jsx', `import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Panel privado (v1)</h2>
      <p>Bienvenido, <strong>{user?.name}</strong>.</p>
      <ul>
        <li><strong>ID:</strong> {user?.id}</li>
        <li><strong>Email:</strong> {user?.email}</li>
        <li><strong>Creado:</strong> {user?.createdAt}</li>
      </ul>
    </div>
  );
}
`);

// ==================== FRONTEND v2 (generado desde v1) ====================

const v1files = [
  'package.json',
  '.env.example',
  '.env',
  'vite.config.js',
  'index.html',
  'src/main.jsx',
  'src/api/axios.js',
  'src/context/AuthContext.jsx',
  'src/components/ProtectedRoute.jsx',
  'src/App.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/Dashboard.jsx',
];

for (const f of v1files) {
  const content = read('frontend-v1-router/' + f);
  const v2content = content.replace(/v1/g, 'v2').replace(/5173/g, '5174');
  write('frontend-v2-usestate/' + f, v2content);
}

console.log('\n🎉 Listo. Todos los archivos fueron generados.');