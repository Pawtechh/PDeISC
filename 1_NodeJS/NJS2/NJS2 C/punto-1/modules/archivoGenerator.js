/**
 * Archivo: archivoGenerator.js
 * Propósito: Módulo que utiliza FILE SYSTEM (FS) para generar y leer archivos HTML (Punto 2)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_DIR = path.join(__dirname, '../temp');

// Asegurar que el directorio temp existe
if (!fs.existsSync(ARCHIVOS_DIR)) {
  fs.mkdirSync(ARCHIVOS_DIR, { recursive: true });
}

/**
 * Genera un archivo HTML dinámicamente usando FS
 * @returns {string} - Ruta del archivo generado
 */
export function generarArchivoHTML() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreArchivo = `archivo_generado_${timestamp}.html`;
  const rutaCompleta = path.join(ARCHIVOS_DIR, nombreArchivo);
  
  const contenidoHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Archivo generado con FS</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f0f2f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    h1 { color: #007bff; }
    .fecha { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 Archivo generado con módulo FS</h1>
    <p>Este archivo fue creado utilizando el módulo <strong>fs (File System)</strong> de Node.js.</p>
    <p class="fecha">Generado el: ${new Date().toLocaleString()}</p>
    <hr>
    <p><strong>Módulos demostrados:</strong> fs.writeFileSync, fs.readFileSync</p>
    <p>✅ El servidor leyó este archivo y lo está mostrando en el navegador.</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(rutaCompleta, contenidoHTML, 'utf8');
  console.log(`📁 Archivo generado: ${rutaCompleta}`);
  return rutaCompleta;
}

/**
 * Lee un archivo HTML y retorna su contenido
 * @param {string} ruta - Ruta del archivo a leer
 * @returns {string} - Contenido del archivo
 */
export function leerArchivoHTML(ruta) {
  try {
    const contenido = fs.readFileSync(ruta, 'utf8');
    return contenido;
  } catch (error) {
    console.error('Error al leer archivo:', error.message);
    return `<p style="color: red;">Error al leer el archivo: ${error.message}</p>`;
  }
}