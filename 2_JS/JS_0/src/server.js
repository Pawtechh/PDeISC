import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuramos los 14 servidores independientes
const totalPuntos = 14;

for (let i = 1; i <= totalPuntos; i++) {
    const app = express();
    const puerto = 3000 + i; // Puertos del 3001 al 3014
    const ip = `127.0.0.${i}`; // IPs del 127.0.0.1 al 127.0.0.14

    // Carpeta de archivos estaticos (CSS y JS compartidos)
    app.use(express.static(path.join(__dirname, '../public')));

    // Cada servidor solo responde a su propio punto
    app.get(`/punto${i}`, (req, res) => {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    });

    // Iniciamos el servidor individualmente
    app.listen(puerto, ip, () => {
        console.log(`>>> Servidor Punto ${i} online en: http://${ip}:${puerto}/punto${i}`);
    });
}