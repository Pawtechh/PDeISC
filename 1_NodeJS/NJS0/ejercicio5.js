
import http from 'node:http'; 
import * as calc from './calculos.js'; 
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    
    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <body>
            <h1>Cálculos del Servidor</h1>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Operación</th><th>Resultado</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Suma (5 + 3)</td><td><strong>${calc.sumar(5, 3)}</strong></td></tr>
                        <tr><td>Resta (8 - 6)</td><td><strong>${calc.restar(8, 6)}</strong></td></tr>
                        <tr><td>Multiplicación (3 * 11)</td><td><strong>${calc.multiplicar(3, 11)}</strong></td></tr>
                        <tr><td>División (30 / 5)</td><td><strong>${calc.dividir(30, 5)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
    
    res.end(html);
});

server.listen(3000, () => {
    console.log("Servidor responsive en: http://localhost:3000");
});