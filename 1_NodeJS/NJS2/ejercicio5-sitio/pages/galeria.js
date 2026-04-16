import { generarMenu } from "../menu.js";

export function renderGaleria() {
  return `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"><title>Galería</title></head><body>
  ${generarMenu("/galeria")}
  <main style="padding:2rem;font-family:sans-serif;">
    <h1>Galería</h1>
    <p>Aquí se mostrarían imágenes de nuestros proyectos.</p>
  </main></body></html>`;
}