//Aqui importo la libreria exress
const express = require("express");

//Llamando a los metodos de express
const app = express();



//Ruta de archivos de pagina
app.use(express.static("public"));


//Configuracion de puerto para el servidor 
app.listen(3003, function(){
    console.log("Servidor corriendo correctamente, ingrese a http://localhost:3003");
});