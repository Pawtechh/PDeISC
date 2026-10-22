require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Usuarios de respaldo en memoria (si MySQL en XAMPP está apagado)
const FALLBACK_USERS = [
  { id: 1, nombre: 'Administrador del Sistema', email: 'admin@test.com', password: '123456', rol: 'Administrador' },
  { id: 2, nombre: 'Juan Pérez', email: 'juan@test.com', password: 'secreto123', rol: 'Desarrollador' },
  { id: 3, nombre: 'María Gómez', email: 'maria@test.com', password: 'maria2026', rol: 'Diseñadora UX/UI' },
  { id: 4, nombre: 'Profesor Titular', email: 'profe@ifts.edu.ar', password: 'reactnative', rol: 'Docente' },
];

let dbPool = null;

// Inicializar conexión con MySQL
async function initDb() {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_usuarios',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await dbPool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL (XAMPP).');
    conn.release();
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a MySQL en XAMPP:', error.message);
    console.warn('ℹ️ El servidor funcionará con la base de usuarios en memoria (fallback) para que puedas probar la app sin interrupciones.');
    dbPool = null;
  }
}

initDb();

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mysql: dbPool ? 'connected' : 'offline_fallback',
    timestamp: new Date().toISOString(),
  });
});

// Ruta para listar usuarios de prueba disponibles
app.get('/api/users', async (req, res) => {
  try {
    if (dbPool) {
      const [rows] = await dbPool.query('SELECT id, nombre, email, rol FROM usuarios');
      return res.json({ success: true, source: 'mysql', users: rows });
    }
  } catch (err) {
    console.error('Error al consultar MySQL:', err.message);
  }
  // Fallback
  const safeUsers = FALLBACK_USERS.map(({ id, nombre, email, rol }) => ({ id, nombre, email, rol }));
  return res.json({ success: true, source: 'memory_fallback', users: safeUsers });
});

// Ruta principal: POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validación en el backend
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son obligatorios.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPass = String(password).trim();

  try {
    // 1. Intentar consulta en MySQL si está conectado
    if (dbPool) {
      const [rows] = await dbPool.query(
        'SELECT id, nombre, email, password, rol FROM usuarios WHERE LOWER(email) = ?',
        [cleanEmail]
      );

      if (rows.length > 0) {
        const user = rows[0];
        if (user.password === cleanPass) {
          console.log(`[LOGIN MYSQL] Acceso concedido a: ${user.email} (${user.nombre})`);
          return res.json({
            success: true,
            message: `¡Bienvenido/a de nuevo, ${user.nombre}!`,
            source: 'mysql',
            user: {
              id: user.id,
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
              horaIngreso: new Date().toLocaleTimeString('es-AR'),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error en consulta MySQL:', error.message);
  }

  // 2. Consulta en Fallback en memoria si MySQL falló o no estaba conectado
  const fallbackMatch = FALLBACK_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
  );

  if (fallbackMatch) {
    console.log(`[LOGIN MEMORY] Acceso concedido a: ${fallbackMatch.email}`);
    return res.json({
      success: true,
      message: `¡Bienvenido/a de nuevo, ${fallbackMatch.nombre}!`,
      source: 'memory_fallback',
      user: {
        id: fallbackMatch.id,
        nombre: fallbackMatch.nombre,
        email: fallbackMatch.email,
        rol: fallbackMatch.rol,
        horaIngreso: new Date().toLocaleTimeString('es-AR'),
      },
    });
  }

  // Si no coincide con ninguno
  console.log(`[LOGIN FALLIDO] Intento fallido para email: ${cleanEmail}`);
  return res.status(401).json({
    success: false,
    message: 'Usuario o contraseña incorrectos.',
  });
});

// Ruta para registrar un nuevo usuario: POST /api/register
app.post('/api/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};

  const cleanNombre = typeof nombre === 'string' ? nombre.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password.trim() : '';
  const cleanRol = typeof rol === 'string' && rol.trim() ? rol.trim() : 'Estudiante';

  // Validaciones del servidor
  if (!cleanNombre || cleanNombre.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'El nombre es obligatorio y debe tener al menos 3 caracteres.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Ingresá un correo electrónico válido.',
    });
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres.',
    });
  }

  try {
    // 1. Intentar registrar en MySQL si está conectado
    if (dbPool) {
      const [existing] = await dbPool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );

      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado en el sistema.',
        });
      }

      const [insertResult] = await dbPool.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [cleanNombre, cleanEmail, cleanPassword, cleanRol]
      );

      const newUser = {
        id: insertResult.insertId,
        nombre: cleanNombre,
        email: cleanEmail,
        rol: cleanRol,
        horaIngreso: new Date().toLocaleTimeString('es-AR'),
      };

      console.log(`[REGISTRO MYSQL] Usuario creado: ${cleanNombre} (${cleanEmail})`);
      return res.status(201).json({
        success: true,
        message: '¡Usuario registrado exitosamente!',
        source: 'mysql',
        user: newUser,
      });
    }
  } catch (error) {
    console.error('Error al insertar en MySQL:', error.message);
  }

  // 2. Registrar en memoria (FALLBACK_USERS)
  const existingFallback = FALLBACK_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (existingFallback) {
    return res.status(409).json({
      success: false,
      message: 'El correo electrónico ya está registrado en el sistema.',
    });
  }

  const newId = FALLBACK_USERS.length > 0 ? Math.max(...FALLBACK_USERS.map((u) => u.id)) + 1 : 1;
  const newFallbackUser = {
    id: newId,
    nombre: cleanNombre,
    email: cleanEmail,
    password: cleanPassword,
    rol: cleanRol,
  };
  FALLBACK_USERS.push(newFallbackUser);

  console.log(`[REGISTRO MEMORIA] Usuario creado: ${cleanNombre} (${cleanEmail})`);
  return res.status(201).json({
    success: true,
    message: '¡Usuario registrado exitosamente!',
    source: 'memory_fallback',
    user: {
      id: newId,
      nombre: cleanNombre,
      email: cleanEmail,
      rol: cleanRol,
      horaIngreso: new Date().toLocaleTimeString('es-AR'),
    },
  });
});

// Iniciar servidor en 0.0.0.0 para que escuche en la red local (celular / Expo Go)
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 API Backend escuchando en http://0.0.0.0:${PORT}`);
  console.log(`📱 En Expo Go celular conectar a: http://10.0.5.80:${PORT}/api/login`);
  console.log('========================================================');
});
