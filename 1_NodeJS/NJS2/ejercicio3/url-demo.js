import { URL } from "url";

const direccion = new URL("https://www.mitienda.com.ar:8080/productos?categoria=ropa&pagina=2#ofertas");

console.log("Host:      ", direccion.host);
console.log("Hostname:  ", direccion.hostname);
console.log("Puerto:    ", direccion.port);
console.log("Protocolo: ", direccion.protocol);
console.log("Pathname:  ", direccion.pathname);
console.log("Search:    ", direccion.search);
console.log("Hash:      ", direccion.hash);
console.log("Origin:    ", direccion.origin);

console.log("\n--- Parámetros de búsqueda ---");
direccion.searchParams.forEach((valor, clave) => {
  console.log(`  ${clave}: ${valor}`);
});