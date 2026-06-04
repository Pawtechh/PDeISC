import express from 'express';
import path from 'path';
import { fileURLTo_url } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/pacman', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'pacman.html'));
});

app.get('/snake', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'snake.html'));
});

// ✅ Ruta para la página móvil (evita 404)
app.get('/mobile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'mobile.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Arcade Retro en http://localhost:${PORT}`);
});