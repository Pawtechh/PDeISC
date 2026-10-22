/**
 * numberUtils.js
 * Funciones puras de validación para números enteros.
 */

export function esNumeroEntero(valor) {
    if (valor === undefined || valor === null || valor === '') return false;
    if (!/^-?\d+$/.test(valor)) return false;
    const num = Number(valor);
    return Number.isInteger(num) && !isNaN(num);
}

export function aEntero(valor) {
    if (!esNumeroEntero(valor)) return null;
    return parseInt(valor, 10);
}

export function esUnico(numero, lista) {
    return !lista.includes(numero);
}
