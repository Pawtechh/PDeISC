/**
 * ARCHIVO: server.js
 * PROPÓSITO: Servidor Express que sirve archivos estáticos y las páginas HTML.
 * MÓDULOS: express
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual (equivalente a __dirname en ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Servir archivos estáticos desde las carpetas correspondientes
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Ruta raíz: envía index.html desde la carpeta pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Ruta adicional por si se quiere acceder directamente a pages/ (opcional)
app.get('/pages/:page', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, 'pages', page));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});