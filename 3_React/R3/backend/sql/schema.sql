-- =========================================================
-- Esquema SQL: Sistema de Gestión de Usuarios y Autenticación
-- Compatible con PostgreSQL (ver notas para MySQL al final)
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NULL,             -- NULL para usuarios que solo usan login social
    role            VARCHAR(20)   NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    provider        VARCHAR(20)   NOT NULL DEFAULT 'local', -- local | google | facebook | github | twitter | discord | twitch
    provider_id     VARCHAR(255)  NULL,             -- ID único que devuelve el proveedor OAuth
    avatar_url      VARCHAR(500)  NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice para acelerar búsquedas por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
-- Evita duplicar la misma cuenta social
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users (provider, provider_id) WHERE provider_id IS NOT NULL;

-- =========================================================
-- Equivalente para MySQL (si usas mysql2 en vez de pg):
-- =========================================================
-- CREATE TABLE IF NOT EXISTS users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(120) NOT NULL,
--   email VARCHAR(150) NOT NULL UNIQUE,
--   password_hash VARCHAR(255) NOT NULL,
--   role ENUM('user','admin') NOT NULL DEFAULT 'user',
--   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
