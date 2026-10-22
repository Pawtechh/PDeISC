/**
 * filtrarNumeros.js
 * Lógica de negocio: validación de contenido, filtrado de números "útiles"
 * (primer y último dígito iguales) y detección de números factoriales.
 */

/**
 * Valida que todas las líneas sean números enteros (positivos).
 * @param {string[]} lineas
 * @returns {{ valid: boolean }}
 */
export function validarSoloNumeros(lineas) {
    const regex = /^\d+$/;
    for (const linea of lineas) {
        if (!regex.test(linea)) return { valid: false };
    }
    return { valid: true };
}

function primerDigito(num) {
    return parseInt(Math.abs(num).toString()[0], 10);
}

function ultimoDigito(num) {
    return Math.abs(num) % 10;
}

/**
 * Un número es "útil" si su primer y último dígito son iguales.
 * @param {number} num
 * @returns {boolean}
 */
export function esUtil(num) {
    return primerDigito(num) === ultimoDigito(num);
}

/**
 * Determina si un número pertenece a la secuencia factorial (1, 2, 6, 24, 120...).
 * @param {number} num
 * @returns {boolean}
 */
export function esFactorial(num) {
    if (num < 1) return false;
    let factorial = 1;
    let i = 1;
    while (factorial < num) {
        i++;
        factorial *= i;
    }
    return factorial === num;
}

/**
 * Filtra un array de números en útiles / no útiles, y dentro de los útiles
 * identifica cuáles son factoriales.
 * @param {number[]} numeros
 * @returns {{ utiles: number[], noUtiles: number[], factoriales: number[] }}
 */
export function filtrarNumerosUtiles(numeros) {
    const utiles = [];
    const noUtiles = [];
    const factoriales = [];

    for (const num of numeros) {
        if (esUtil(num)) {
            utiles.push(num);
            if (esFactorial(num)) factoriales.push(num);
        } else {
            noUtiles.push(num);
        }
    }

    return { utiles, noUtiles, factoriales };
}
