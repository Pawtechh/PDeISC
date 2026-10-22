//Servidor Express para Punto 3 - unshift()
const express = require("express");
const app = express();

app.use(express.static("public"));

app.listen(3003, function () {
  console.log("Servidor corriendo correctamente, ingrese a http://localhost:3003");
});
