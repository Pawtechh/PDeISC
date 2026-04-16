import http from "http";
import { URL } from "url";
import { upperCase } from "upper-case";

import { renderInicio }    from "./pages/inicio.js";
import { renderNosotros }  from "./pages/nosotros.js";
import { renderServicios } from "./pages/servicios.js";
import { renderGaleria }   from "./pages/galeria.js";
import { renderContacto }  from "./pages/contacto.js";

const PORT = 3000;

const rutas = {
  "/":          renderInicio,
  "/nosotros":  renderNosotros,
  "/servicios": renderServicios,
  "/galeria":   renderGaleria,
  "/contacto":  renderContacto,
};

const server = http.createServer((req, res) => {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const handler  = rutas[pathname];

  console.log(upperCase(`petición a: ${pathname}`));

  if (handler) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(handler());
  } else {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 — Página no encontrada</h1>");
  }
});

server.listen(PORT, () => {
  console.log(`Sitio corriendo en http://localhost:${PORT}`);
});