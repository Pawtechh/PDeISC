import { generarMenu } from "../menu.js";

export function renderNosotros() {
  return `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"><title>Nosotros</title></head><body>
  ${generarMenu("/nosotros")}
  <main style="padding:2rem;font-family:sans-serif;">
    <h1>Nosotros</h1>
    <p>Somos un equipo apasionado por el desarrollo web con Node.js.</p>
  </main></body></html>`;
}