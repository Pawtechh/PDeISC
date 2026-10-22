//Servidor Express para Punto 2 - pop()
const express = require("express");
const app = express();

app.use(express.static("public"));

app.listen(3002, function () {
  console.log("Servidor corriendo correctamente, ingrese a http://localhost:3002");
});
