/**
 * ARCHIVO: server.js
 * PROPOSITO: Servidor Express que sirve archivos estaticos y la pagina principal.
 */
const express = require("express");
const app = express();

app.use(express.static("public"));

app.listen(3006, function () {
  console.log("Servidor corriendo correctamente, ingrese a http://localhost:3006");
});
