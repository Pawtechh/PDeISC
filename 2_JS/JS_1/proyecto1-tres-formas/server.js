/**
 * ARCHIVO: server.js
 * PROPÓSITO: Servidor Express para proyecto1 (Puerto 3001)
 * MÓDULOS: express
 * FUNCIONALIDAD: Sirve archivos estáticos y rutas para la página principal
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware para servir archivos estáticos desde las carpetas correspondientes
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Ruta raíz: envía index.html desde la carpeta pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Proyecto 1 corriendo en http://localhost:${PORT}`);
    console.log(`📝 Demostración: 3 formas de leer formularios`);
});