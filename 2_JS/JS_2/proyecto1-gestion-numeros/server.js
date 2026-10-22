/**
 * server.js
 * Servidor Express con endpoint /guardar-txt para persistir el archivo en el servidor.
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
        if (!Array.isArray(numeros) || numeros.length < 10 || numeros.length > 20) {
            return res.status(400).json({ error: 'Se requieren entre 10 y 20 números' });
        }

        const contenido = numeros.join('\n');
        const nombreArchivo = `numeros_${Date.now()}.txt`;
        const carpeta = path.join(__dirname, 'archivos');
        if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta);
        fs.writeFileSync(path.join(carpeta, nombreArchivo), contenido, 'utf8');

        res.json({ exito: true, nombreArchivo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
