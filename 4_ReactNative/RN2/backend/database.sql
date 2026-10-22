-- ==========================================================
-- Base de Datos para Trabajo Práctico N° 2 (RN2)
-- Acceso de Usuarios con React Native y Node.js / PHP / MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `db_usuarios` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_usuarios`;

-- Tabla de Usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) DEFAULT 'Usuario',
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios de prueba para iniciar sesión
INSERT INTO `usuarios` (`nombre`, `email`, `password`, `rol`) VALUES
('Administrador del Sistema', 'admin@test.com', '123456', 'Administrador'),
('Juan Pérez', 'juan@test.com', 'secreto123', 'Desarrollador'),
('María Gómez', 'maria@test.com', 'maria2026', 'Diseñadora UX/UI'),
('Profesor Titular', 'profe@ifts.edu.ar', 'reactnative', 'Docente');
