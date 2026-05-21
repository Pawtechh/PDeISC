// Módulo de operaciones matemáticas (CommonJS para compatibilidad)

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

module.exports = {
    sumar,
    restar,
    multiplicar,
    dividir
};