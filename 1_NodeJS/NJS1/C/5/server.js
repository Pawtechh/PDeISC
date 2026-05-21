const express = require('express');
const path = require('path');
const calculos = require('./modules/calculos.js');

const app = express();
const PORT = 3000;

// Servir archivos estáticos
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.get('/', (req, res) => {
    // Realizar cálculos
    const resultados = [
        { operacion: "Suma", expresion: "5 + 3", resultado: calculos.sumar(5, 3) },
        { operacion: "Resta", expresion: "8 - 6", resultado: calculos.restar(8, 6) },
        { operacion: "Multiplicación", expresion: "3 × 11", resultado: calculos.multiplicar(3, 11) },
        { operacion: "División", expresion: "30 ÷ 5", resultado: calculos.dividir(30, 5) },
        { operacion: "Suma extra", expresion: "4 + 5", resultado: calculos.sumar(4, 5) },
        { operacion: "Resta extra", expresion: "3 - 6", resultado: calculos.restar(3, 6) },
        { operacion: "Multiplicación extra", expresion: "2 × 7", resultado: calculos.multiplicar(2, 7) },
        { operacion: "División extra", expresion: "20 ÷ 4", resultado: calculos.dividir(20, 4) }
    ];

    // Generar filas de la tabla
    const filasTabla = resultados.map(r => `
        <tr>
            <td>${r.operacion}</td>
            <td>${r.expresion}</td>
            <td class="resultado">${r.resultado}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resultados de operaciones</title>
        <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
        <div class="container">
            <h1>📊 Resultados de Operaciones Matemáticas</h1>
            <table>
                <thead>
                    <tr>
                        <th>Operación</th>
                        <th>Expresión</th>
                        <th>Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
            <div class="footer">
                <p>Ejercicio 5 - Node.js con Express</p>
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});