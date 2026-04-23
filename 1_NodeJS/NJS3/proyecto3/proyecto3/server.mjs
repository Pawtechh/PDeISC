import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Servir archivos estáticos desde 'public'
app.use(express.static(join(__dirname, 'public')));

// Ruta principal para servir el HTML
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proyecto 3 corriendo en http://localhost:${PORT}`);
});