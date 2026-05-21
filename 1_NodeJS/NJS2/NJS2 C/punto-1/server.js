/**
 * Archivo: server.js
 * Propósito: Servidor Express que integra módulos propios y nativos de Node.js
 * Módulos utilizados: express, path, fs, http (nativo), url (nativo), upper-case
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import url from 'url';
import upperCase from 'upper-case';

// Módulos propios
import { generarMenuHTML } from './modules/menu.js';
import { obtenerClimaActual, obtenerPronostico } from './modules/clima.js';
import { Calculadora, convertirUnidades } from './modules/calculos.js';
import { generarArchivoHTML, leerArchivoHTML } from './modules/archivoGenerator.js';
import { analizarURL } from './modules/urlParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3006;

// Servir archivos estáticos
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// ============ PUNTO 1: COMPONENTE CON MÓDULOS PROPIOS ============
// Ruta para página de clima
app.get('/clima', (req, res) => {
  const climaActual = obtenerClimaActual('Buenos Aires');
  const pronostico = obtenerPronostico();
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clima - Módulo propio</title>
      <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
      <div class="app-container">
        ${generarMenuHTML('clima')}
        <main class="main-content">
          <h1>🌤️ Componente Clima (Módulo propio)</h1>
          <div class="card">
            <h2>Clima actual</h2>
            <p><strong>Ciudad:</strong> ${climaActual.ciudad}</p>
            <p><strong>Temperatura:</strong> ${climaActual.temperatura}°C</p>
            <p><strong>Condición:</strong> ${climaActual.condicion}</p>
            <p><strong>Humedad:</strong> ${climaActual.humedad}%</p>
          </div>
          <div class="card">
            <h2>Pronóstico 3 días</h2>
            <ul>
              ${pronostico.map(dia => `<li>${dia.dia}: ${dia.tempMin}°C - ${dia.tempMax}°C, ${dia.condicion}</li>`).join('')}
            </ul>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Ruta para página de cálculos
app.get('/calculos', (req, res) => {
  const calc = new Calculadora();
  const suma = calc.sumar(15, 27);
  const resta = calc.restar(100, 45);
  const multiplicacion = calc.multiplicar(8, 7);
  const division = calc.dividir(81, 9);
  const metrosAPies = convertirUnidades(10, 'm', 'ft');
  const kilosALibras = convertirUnidades(5, 'kg', 'lb');
  
  // Uso de upper-case (punto 4)
  const textoMayusculas = upperCase('este texto fue convertido con upper-case');
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cálculos - Módulo propio</title>
      <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
      <div class="app-container">
        ${generarMenuHTML('calculos')}
        <main class="main-content">
          <h1>🧮 Componente Cálculos (Módulo propio)</h1>
          <div class="card">
            <h2>Operaciones básicas</h2>
            <p>15 + 27 = <strong>${suma}</strong></p>
            <p>100 - 45 = <strong>${resta}</strong></p>
            <p>8 × 7 = <strong>${multiplicacion}</strong></p>
            <p>81 ÷ 9 = <strong>${division}</strong></p>
          </div>
          <div class="card">
            <h2>Conversión de unidades</h2>
            <p>10 metros = ${metrosAPies} pies</p>
            <p>5 kilogramos = ${kilosALibras} libras</p>
          </div>
          <div class="card">
            <h2>📦 Demostración de NPM (upper-case)</h2>
            <p><strong>Texto original:</strong> "este texto fue convertido con upper-case"</p>
            <p><strong>En mayúsculas:</strong> "${textoMayusculas}"</p>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// ============ PUNTO 2: MÓDULO HTTP + FILE SYSTEM ============
// Ruta que genera y lee un archivo HTML usando FS
app.get('/archivo-html', (req, res) => {
  // Generar archivo HTML (usa FS)
  const rutaArchivo = generarArchivoHTML();
  
  // Leer el archivo generado (usa FS)
  const contenido = leerArchivoHTML(rutaArchivo);
  
  // También demostramos uso del módulo HTTP nativo (punto 2)
  // Hacemos una petición simple a una API pública para demostrar http
  let httpData = '';
  const httpRequest = http.get('http://jsonplaceholder.typicode.com/todos/1', (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      const parsed = JSON.parse(data);
      httpData = `<p><strong>Petición HTTP nativa:</strong> Tarea: ${parsed.title} (ID: ${parsed.id})</p>`;
      
      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Archivo HTML + FS + HTTP</title>
          <link rel="stylesheet" href="/styles/main.css">
        </head>
        <body>
          <div class="app-container">
            ${generarMenuHTML('archivo-html')}
            <main class="main-content">
              <h1>📁 Módulo FS + HTTP</h1>
              <div class="card">
                <h2>Archivo generado con FS</h2>
                <p><strong>Ruta del archivo:</strong> ${rutaArchivo}</p>
                <div style="background-color: var(--preview-bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                  ${contenido}
                </div>
              </div>
              <div class="card">
                <h2>🌐 Módulo HTTP nativo</h2>
                ${httpData}
                <p><small>Se realizó una petición GET a JSONPlaceholder usando el módulo http de Node.js</small></p>
              </div>
            </main>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    });
  });
  httpRequest.on('error', (err) => {
    console.error('Error HTTP:', err);
  });
});

// ============ PUNTO 3: MÓDULO URL ============
// Ruta que analiza la URL actual y muestra en consola del servidor
app.get('/info-url', (req, res) => {
  // Obtener la URL completa de la petición
  const urlCompleta = req.protocol + '://' + req.get('host') + req.originalUrl;
  
  // Usar módulo URL nativo para analizar
  const urlAnalizada = analizarURL(urlCompleta);
  
  // Mostrar en consola del servidor (PUNTO 3)
  console.log('\n========== MÓDULO URL - SERVIDOR ==========');
  console.log(`URL completa: ${urlAnalizada.href}`);
  console.log(`Host: ${urlAnalizada.host}`);
  console.log(`Path: ${urlAnalizada.pathname}`);
  console.log(`Query string: ${urlAnalizada.search || '(ninguno)'}`);
  console.log(`Parámetros:`, urlAnalizada.queryParams);
  console.log(`Protocolo: ${urlAnalizada.protocol}`);
  console.log(`===========================================\n`);
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Info URL - Módulo URL</title>
      <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
      <div class="app-container">
        ${generarMenuHTML('info-url')}
        <main class="main-content">
          <h1>🔗 Módulo URL de Node.js</h1>
          <div class="card">
            <h2>URL analizada</h2>
            <p><strong>URL completa:</strong> ${urlAnalizada.href}</p>
            <p><strong>Host:</strong> ${urlAnalizada.host}</p>
            <p><strong>Path:</strong> ${urlAnalizada.pathname}</p>
            <p><strong>Query string:</strong> ${urlAnalizada.search || '(ninguno)'}</p>
            <p><strong>Protocolo:</strong> ${urlAnalizada.protocol}</p>
            <h3>Parámetros de consulta:</h3>
            <pre>${JSON.stringify(urlAnalizada.queryParams, null, 2)}</pre>
          </div>
          <div class="card">
            <h2>📋 Consola del servidor</h2>
            <p>Revisa la terminal donde ejecutaste <code>node server.js</code>.</p>
            <p>Allí encontrarás el análisis de la URL impreso por el módulo <strong>url</strong> de Node.js.</p>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// ============ PUNTO 5: PÁGINA DE INICIO ============
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proyecto Node.js - Módulos</title>
      <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
      <div class="app-container">
        ${generarMenuHTML('inicio')}
        <main class="main-content">
          <h1>📦 Proyecto Node.js - Demostración de Módulos</h1>
          <div class="cards-grid">
            <div class="card">
              <h2>📌 Punto 1</h2>
              <p>Módulos propios: <strong>Clima</strong> y <strong>Cálculos</strong> con funciones reutilizables.</p>
              <a href="/clima" class="action-btn primary">Ver Clima</a>
              <a href="/calculos" class="action-btn success">Ver Cálculos</a>
            </div>
            <div class="card">
              <h2>📌 Punto 2</h2>
              <p>Módulos <strong>HTTP</strong> y <strong>FILE SYSTEM (FS)</strong>. Genera y lee archivos HTML.</p>
              <a href="/archivo-html" class="action-btn warning">Ver FS + HTTP</a>
            </div>
            <div class="card">
              <h2>📌 Punto 3</h2>
              <p>Módulo <strong>URL</strong>. Analiza la URL y muestra en consola del servidor.</p>
              <a href="/info-url?param1=valor1&param2=valor2&usuario=nodejs" class="action-btn info">Ver Info URL</a>
            </div>
            <div class="card">
              <h2>📌 Punto 4</h2>
              <p>Instalación de <strong>NPM: upper-case</strong>. Usado en la página de cálculos.</p>
              <a href="/calculos" class="action-btn secondary">Ver upper-case</a>
            </div>
            <div class="card">
              <h2>📌 Punto 5</h2>
              <p>Menú modular con links a <strong>5 páginas diferentes</strong> (Inicio, Clima, Cálculos, Archivo HTML, Info URL).</p>
            </div>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📌 Menú con 5 páginas accesibles desde el navbar`);
});