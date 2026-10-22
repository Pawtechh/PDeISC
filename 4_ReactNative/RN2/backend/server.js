require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Iniciar servidor en 0.0.0.0 para que escuche en la red local (celular / Expo Go)
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 API Backend escuchando en http://0.0.0.0:${PORT}`);
  console.log(`📱 En Expo Go celular conectar a: http://192.168.100.63:${PORT}/api/login`);
  console.log('========================================================');
});
