/**
 * server.js
 * Propósito: Servidor Express con endpoint /guardar-txt para guardar archivo en el servidor.
 * No envía el archivo al cliente; solo responde con éxito.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.post('/guardar-txt', (req, res) => {
    try {
        const { numeros } = req.body;
        if (!Array.isArray(numeros) || numeros.length === 0) {
            return res.status(400).json({ error: 'No se recibieron números válidos' });
        }

        const contenido = numeros.join('\n');
        const timestamp = Date.now();
        const nombreArchivo = `numeros_${timestamp}.txt`;
        const rutaArchivo = path.join(__dirname, 'archivos', nombreArchivo);

        if (!fs.existsSync(path.join(__dirname, 'archivos'))) {
            fs.mkdirSync(path.join(__dirname, 'archivos'));
        }
        fs.writeFileSync(rutaArchivo, contenido, 'utf8');

        res.json({ exito: true, nombreArchivo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});