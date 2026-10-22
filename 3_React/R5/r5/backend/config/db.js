const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'auth.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    avatar_url    TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS oauth_accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    provider    TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migración para bases creadas con versiones anteriores
const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
if (!cols.includes('avatar_url')) db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');

// Asegurar que password_hash permita NULL para cuentas de login social (OAuth)
const usersSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
if (usersSql.includes('password_hash TEXT NOT NULL')) {
  db.exec(`
    PRAGMA foreign_keys=OFF;
    CREATE TABLE users_migrated (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar_url    TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users_migrated (id, name, email, password_hash, avatar_url, created_at, updated_at)
      SELECT id, name, email, password_hash, avatar_url, created_at, updated_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_migrated RENAME TO users;
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    PRAGMA foreign_keys=ON;
  `);
}

// Usuarios de prueba iniciales para login local inmediato
const bcrypt = require('bcryptjs');
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('test@ejemplo.com');
if (!existingUser) {
  const hash = bcrypt.hashSync('Usuario123!', 10);
  db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run('Usuario de Prueba', 'test@ejemplo.com', hash);
}

module.exports = db;
