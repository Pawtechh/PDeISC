// Llamar al módulo calculos.js y mostrar resultados

const calculos = require('./calculos.js');

console.log("=== Resultados usando módulo calculos ===");
console.log("Suma de 5 + 3 =", calculos.sumar(5, 3));
console.log("Resta de 8 - 6 =", calculos.restar(8, 6));
console.log("Multiplicación de 3 * 11 =", calculos.multiplicar(3, 11));
console.log("División de 30 / 5 =", calculos.dividir(30, 5));