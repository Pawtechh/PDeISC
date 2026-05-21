/**
 * Archivo: server.js
 * Proposito: Servidor Express que sirve archivos estaticos y rutas HTML
 * Modulos utilizados: express, path
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Servir archivos estaticos desde las carpetas correspondientes
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Ruta principal: sirve index.html desde la carpeta pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});