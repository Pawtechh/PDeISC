// Funciones para operaciones matemáticas

function sumar(a, b) {
    return a + b;
}

function restar(a, b) {
    return a - b;
}

function multiplicar(a, b) {
    return a * b;
}

function dividir(a, b) {
    if (b === 0) {
        return "Error: No se puede dividir por cero";
    }
    return a / b;
}

// Mostrar resultados
console.log("Suma de 4 + 5 =", sumar(4, 5));
console.log("Resta de 3 - 6 =", restar(3, 6));
console.log("Multiplicación de 2 * 7 =", multiplicar(2, 7));
console.log("División de 20 / 4 =", dividir(20, 4));