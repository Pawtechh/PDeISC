// Módulo de operaciones matemáticas

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

// Exportar funciones para usar en otros archivos
module.exports = {
    sumar,
    restar,
    multiplicar,
    dividir
};