/**
 * filtrarNumeros.js
 * Propósito: Funciones para determinar si un número empieza y termina con el mismo dígito,
 * y filtrar un array de números.
 */

/**
 * Obtiene el primer dígito de un número (absoluto).
 * @param {number} num 
 * @returns {number}
 */
function primerDigito(num) {
    const absNum = Math.abs(num);
    return parseInt(absNum.toString()[0], 10);
}

/**
 * Obtiene el último dígito de un número.
 * @param {number} num 
 * @returns {number}
 */
function ultimoDigito(num) {
    return Math.abs(num) % 10;
}

/**
 * Determina si un número es "útil": primer y último dígito iguales.
 * @param {number} num 
 * @returns {boolean}
 */
export function esUtil(num) {
    return primerDigito(num) === ultimoDigito(num);
}

/**
 * Filtra un array de números, separando útiles y no útiles.
 * @param {number[]} numeros 
 * @returns {{ utiles: number[], noUtiles: number[] }}
 */
export function filtrarNumerosUtiles(numeros) {
    const utiles = [];
    const noUtiles = [];
    for (const num of numeros) {
        if (esUtil(num)) {
            utiles.push(num);
        } else {
            noUtiles.push(num);
        }
    }
    return { utiles, noUtiles };
}