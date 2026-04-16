import { generarMenu } from "../menu.js";

export function renderServicios() {
  return `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"><title>Servicios</title></head><body>
  ${generarMenu("/servicios")}
  <main style="padding:2rem;font-family:sans-serif;">
    <h1>Servicios</h1>
    <ul>
      <li>Desarrollo web</li>
      <li>APIs REST</li>
      <li>Consultoría Node.js</li>
    </ul>
  </main></body></html>`;
}