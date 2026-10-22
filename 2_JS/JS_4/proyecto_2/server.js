/**
 * server.js
 * Propósito: Servidor Express que maneja subida de archivos .txt,
 * procesa el filtrado de números (mismo primer y último dígito),
 * sobrescribe el archivo subido con el resultado filtrado y ordenado,
 * y envía los datos al frontend.
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { filtrarNumerosUtiles } from './modules/filtrarNumeros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Puerto distinto al punto 1 para evitar conflicto

// Configuración de multer: guardar en carpeta /uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Mantener nombre original o generar uno único
        cb(null, file.originalname);
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

// Servir archivos estáticos
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Endpoint para subir y procesar archivo
app.post('/procesar', upload.single('archivoTxt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }

        const filePath = req.file.path;
        // Leer contenido del archivo
        const contenido = fs.readFileSync(filePath, 'utf8');
        const lineas = contenido.split(/\r?\n/).filter(linea => linea.trim() !== '');

        // Convertir a números (ignorar no numéricos)
        const numeros = lineas.map(Number).filter(n => !isNaN(n));

        if (numeros.length === 0) {
            return res.status(400).json({ error: 'El archivo no contiene números válidos' });
        }

        // Filtrar números que empiezan y terminan con el mismo dígito
        const { utiles, noUtiles } = filtrarNumerosUtiles(numeros);
        const utilesOrdenados = [...utiles].sort((a, b) => a - b);

        const total = numeros.length;
        const cantidadUtiles = utilesOrdenados.length;
        const cantidadNoUtiles = noUtiles.length;
        const porcentajeUtiles = total > 0 ? (cantidadUtiles / total * 100).toFixed(2) : 0;

        // Guardar (sobrescribir) el archivo en el servidor con el resultado filtrado y ordenado
        const nuevoContenido = utilesOrdenados.join('\n');
        fs.writeFileSync(filePath, nuevoContenido, 'utf8');

        // Responder con los datos y el nombre del archivo
        res.json({
            exito: true,
            nombreArchivo: req.file.originalname,
            total,
            cantidadUtiles,
            cantidadNoUtiles,
            porcentajeUtiles,
            utilesOrdenados
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para descargar el archivo ya procesado (el mismo que está en uploads)
app.get('/descargar/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const filePath = path.join(__dirname, 'uploads', nombre);
    if (fs.existsSync(filePath)) {
        res.download(filePath, `filtrado_${nombre}`);
    } else {
        res.status(404).json({ error: 'Archivo no encontrado' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de filtrado corriendo en http://localhost:${PORT}`);
});