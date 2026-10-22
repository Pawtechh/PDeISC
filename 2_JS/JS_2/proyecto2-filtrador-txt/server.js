/**
 * server.js
 * Servidor Express: recibe un .txt, valida y filtra números (útiles / factoriales),
 * guarda el resultado filtrado en el servidor y permite descargarlo.
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validarSoloNumeros, filtrarNumerosUtiles } from './modules/filtrarNumeros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Puerto distinto al del proyecto 1

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .txt'), false);
        }
    }
});

app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.post('/procesar', upload.single('archivoTxt'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        const filePath = req.file.path;
        const contenido = fs.readFileSync(filePath, 'utf8');
        const lineas = contenido.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');

        if (lineas.length === 0) {
            return res.status(400).json({ error: 'El archivo está vacío' });
        }

        const validacion = validarSoloNumeros(lineas);
        if (!validacion.valid) {
            return res.status(400).json({
                success: false,
                error: 'El archivo debe contener solo un número entero por línea.'
            });
        }

        const numeros = lineas.map(Number);

        const { utiles, noUtiles, factoriales } = filtrarNumerosUtiles(numeros);
        const utilesOrdenados = [...utiles].sort((a, b) => a - b);

        const total = numeros.length;
        const cantidadUtiles = utilesOrdenados.length;
        const cantidadNoUtiles = noUtiles.length;
        const porcentajeUtiles = total > 0 ? (cantidadUtiles / total * 100).toFixed(2) : 0;

        // Guardar el resultado filtrado como un nuevo archivo (no se sobrescribe el original)
        const nombreResultado = `resultado-${Date.now()}.txt`;
        const carpetaResultados = path.join(__dirname, 'resultados');
        if (!fs.existsSync(carpetaResultados)) fs.mkdirSync(carpetaResultados);
        fs.writeFileSync(path.join(carpetaResultados, nombreResultado), utilesOrdenados.join('\n'), 'utf8');

        res.json({
            success: true,
            nombreArchivo: nombreResultado,
            total,
            cantidadUtiles,
            cantidadNoUtiles,
            porcentajeUtiles,
            utilesOrdenados,
            factoriales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/descargar/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const filePath = path.join(__dirname, 'resultados', nombre);
    if (fs.existsSync(filePath)) {
        res.download(filePath, `filtrado_${nombre}`);
    } else {
        res.status(404).json({ error: 'Archivo no encontrado' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de filtrado corriendo en http://localhost:${PORT}`);
});
