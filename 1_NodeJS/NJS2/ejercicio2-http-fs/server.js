import http from "http";
import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT = 3000;

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, "index.html");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error al leer el archivo");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});