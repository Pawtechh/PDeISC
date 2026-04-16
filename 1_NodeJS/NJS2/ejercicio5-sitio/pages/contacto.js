import { generarMenu } from "../menu.js";

export function renderContacto() {
  return `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"><title>Contacto</title></head><body>
  ${generarMenu("/contacto")}
  <main style="padding:2rem;font-family:sans-serif;">
    <h1>Contacto</h1>
    <p>Email: info@misitio.com.ar</p>
    <p>Tel: +54 223 000-0000</p>
  </main></body></html>`;
}