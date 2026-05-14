const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/guardar', (req, res) => {
  const { numeros } = req.body;
  if (!numeros || !Array.isArray(numeros)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  const fecha = new Date().toLocaleString('es-AR');
  const vals = numeros.map(Number);
  const sum = vals.reduce((a, b) => a + b, 0);
  const contenido = [
    '╔══════════════════════════════╗',
    '║      LISTA DE NÚMEROS        ║',
    '╚══════════════════════════════╝',
    '',
    `  Fecha:    ${fecha}`,
    `  Total:    ${numeros.length} números`,
    '',
    '  ── Valores ingresados ────────',
    ...numeros.map((n, i) => `  ${String(i + 1).padStart(2, '0')}. ${n}`),
    '',
    '  ── Estadísticas ──────────────',
    `  Suma:     ${sum % 1 === 0 ? sum : sum.toFixed(4)}`,
    `  Promedio: ${(sum / vals.length).toFixed(4)}`,
    `  Mínimo:   ${Math.min(...vals)}`,
    `  Máximo:   ${Math.max(...vals)}`,
    '',
    '══════════════════════════════════',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="numeros.txt"');
  res.send(contenido);
});

app.listen(PORT, () => {
  console.log(`\n✓ Servidor corriendo en http://localhost:${PORT}\n`);
});
