/**
 * Modulo: modules/moduloGeneradorServidor.js
 * Proposito: Contiene la logica central del lado del servidor Node.js para generar contrasenias
 *            criptograficamente seguras y evaluar su nivel de fortaleza en base 100.
 *            Demuestra el uso de Arrays/Vectores de caracteres, algoritmos de barajado,
 *            el modulo nativo node:crypto y la clase de configuracion con import/export.
 * Modulos usados:
 *   - node:crypto (randomInt): Generador aleatorio nativo de alta seguridad de Node.js.
 *   - ./moduloClases.js (ConfiguracionGenerador): Clase para validar las opciones enviadas por el cliente.
 */

import { randomInt } from 'node:crypto';
import { ConfiguracionGenerador } from './moduloClases.js';

// Vectores/Arrays base con los caracteres disponibles en el sistema
// Usamos .split('') para convertir la cadena en un vector iterable elemento por elemento
const VECTOR_MAYUSCULAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VECTOR_MINUSCULAS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VECTOR_NUMEROS = '0123456789'.split('');
const VECTOR_SIMBOLOS = '!@#$%^&*()-_=+[]{};:,.?'.split('');

// Conjunto de caracteres visualmente ambiguos que pueden confundirse al leer o tipear
// (por ejemplo: el cero '0' con la letra 'O', o el uno '1' con la 'I' mayuscula o la 'l' minuscula)
const CARACTERES_AMBIGUOS = new Set(['0', 'O', 'o', '1', 'I', 'l']);

/**
 * Filtra los caracteres que se prestan a confusion visual si el usuario tildo esa opcion.
 * Si evitarAmbiguos es true, excluye los caracteres visualmente confusos (0, O, o, 1, I, l).
 * @param {string[]} vector Vector original de caracteres.
 * @param {boolean} evitarAmbiguos Si es true, excluye los ambiguos; si es false, deja el vector intacto.
 * @returns {string[]} Nuevo vector con los caracteres permitidos.
 */
function filtrarAmbiguos(vector, evitarAmbiguos) {
    if (!evitarAmbiguos) return [...vector];
    return vector.filter((caracter) => !CARACTERES_AMBIGUOS.has(caracter));
}

/**
 * Elige un caracter al azar de un vector de forma criptograficamente segura.
 * En lugar de Math.random() (pseudoaleatorio y predecible), utiliza crypto.randomInt de Node.js,
 * conectado con la entropia criptografica del sistema operativo para garantizar impredecibilidad.
 * 
 * @param {string[]} vector Arreglo de donde sacar el caracter.
 * @returns {string} El caracter seleccionado al azar.
 */
function elegirAleatorio(vector) {
    const indiceAleatorio = randomInt(0, vector.length);
    return vector[indiceAleatorio];
}

/**
 * Mezcla aleatoriamente los elementos de un vector usando el Algoritmo Fisher-Yates (o Knuth Shuffle).
 * Recorre el vector de atras hacia adelante intercambiando cada posicion con otra elegida
 * aleatoriamente mediante randomInt, eliminando cualquier patron posicional predecible.
 * 
 * @param {string[]} vector Vector de caracteres a mezclar en su propio lugar.
 * @returns {string[]} El mismo vector barajado.
 */
function mezclarVector(vector) {
    for (let i = vector.length - 1; i > 0; i -= 1) {
        const j = randomInt(0, i + 1);
        const aux = vector[i];
        vector[i] = vector[j];
        vector[j] = aux;
    }
    return vector;
}

/**
 * Evalua la fortaleza de una contrasenia del lado del servidor.
 * Calcula la fortaleza de la clave asignando puntaje segun su longitud y diversidad de caracteres:
 * - Longitud: hasta 45 puntos.
 * - Mayusculas: +13 puntos.
 * - Minusculas: +13 puntos.
 * - Numeros: +14 puntos.
 * - Simbolos especiales: +15 puntos.
 * Con esa suma (de 0 a 100), define si es 'Debil', 'Media', 'Fuerte' o 'Muy Fuerte',
 * devolviendo tambien la clase CSS correspondiente para pintar la barra en la pantalla.
 * @param {string} contrasena Texto de la clave a analizar.
 * @returns {{ puntuacion: number, nivelSeguridad: string, claseSeguridad: string }}
 */
export function evaluarSeguridad(contrasena) {
    const texto = String(contrasena || '');
    const longitud = texto.length;

    // Calculamos puntaje base por longitud (mas larga = mas puntos)
    let puntuacion = Math.min(45, longitud * 2.2);

    // Sumamos puntos por presencia de cada tipo de caracter mediante expresiones regulares
    if (/[A-Z]/.test(texto)) puntuacion += 13;
    if (/[a-z]/.test(texto)) puntuacion += 13;
    if (/[0-9]/.test(texto)) puntuacion += 14;
    if (/[^A-Za-z0-9]/.test(texto)) puntuacion += 15;

    // Aseguramos que la puntuacion quede acotada entre 5 y 100
    puntuacion = Math.max(5, Math.min(100, Math.round(puntuacion)));

    // Determinamos categoria cualitativa y clase de estilo
    let nivelSeguridad = 'Debil';
    let claseSeguridad = 'debil';
    if (puntuacion >= 85) {
        nivelSeguridad = 'Muy Fuerte';
        claseSeguridad = 'muy-fuerte';
    } else if (puntuacion >= 68) {
        nivelSeguridad = 'Fuerte';
        claseSeguridad = 'fuerte';
    } else if (puntuacion >= 45) {
        nivelSeguridad = 'Media';
        claseSeguridad = 'media';
    }

    return { puntuacion, nivelSeguridad, claseSeguridad };
}

/**
 * Genera una contrasenia individual respetando todas las reglas solicitadas.
 * Garantiza al menos un caracter de cada grupo habilitado, completa la longitud requerida
 * usando el alfabeto unificado y baraja el vector resultante con mezclarVector().
 * 
 * @param {ConfiguracionGenerador} config Instancia con las opciones validadas.
 * @returns {string} La contrasenia final en texto plano.
 */
function generarUnaContrasena(config) {
    const grupos = [];
    if (config.incluirMayusculas) grupos.push(filtrarAmbiguos(VECTOR_MAYUSCULAS, config.evitarAmbiguos));
    if (config.incluirMinusculas) grupos.push(filtrarAmbiguos(VECTOR_MINUSCULAS, config.evitarAmbiguos));
    if (config.incluirNumeros) grupos.push(filtrarAmbiguos(VECTOR_NUMEROS, config.evitarAmbiguos));
    if (config.incluirSimbolos) grupos.push(filtrarAmbiguos(VECTOR_SIMBOLOS, config.evitarAmbiguos));

    const gruposActivos = grupos.filter((g) => g.length > 0);
    if (gruposActivos.length === 0) {
        throw new Error('No quedaron caracteres disponibles con la configuracion elegida.');
    }

    // Alfabeto combinado para rellenar el resto
    const alfabeto = gruposActivos.flat();
    const resultado = [];

    // 1. Garantizamos al menos un caracter de cada grupo tildado
    for (let i = 0; i < gruposActivos.length && resultado.length < config.longitud; i += 1) {
        resultado.push(elegirAleatorio(gruposActivos[i]));
    }

    // 2. Completamos hasta alcanzar la longitud deseada
    while (resultado.length < config.longitud) {
        resultado.push(elegirAleatorio(alfabeto));
    }

    // 3. Barajamos para romper cualquier patron posicional
    mezclarVector(resultado);
    return resultado.join('');
}

/**
 * Genera un vector con la cantidad de contrasenias solicitadas (de 1 a 5) y evalua cada una.
 * Punto de entrada utilizado por el servidor ante POST /api/generar: valida la configuracion,
 * genera las claves solicitadas y adjunta la evaluacion de seguridad de cada una.
 * 
 * @param {Object|ConfiguracionGenerador} datosConfig Opciones enviadas desde el cliente.
 * @returns {Object} Objeto con la configuracion, tipos activos, clave principal y lista completa.
 */
export function generarContrasenasServidor(datosConfig = {}) {
    // Si no vino como instancia de clase, la instanciamos para que sus setters validen todo
    const config = datosConfig instanceof ConfiguracionGenerador
        ? datosConfig
        : new ConfiguracionGenerador(datosConfig);

    config.validar();

    const vectorGeneradas = [];
    for (let i = 0; i < config.cantidad; i += 1) {
        const contrasena = generarUnaContrasena(config);
        const seguridad = evaluarSeguridad(contrasena);
        vectorGeneradas.push({
            contrasena,
            longitud: contrasena.length,
            ...seguridad
        });
    }

    return {
        configuracion: config.aObjetoPlano(),
        tiposActivos: config.tiposActivos,
        principal: vectorGeneradas[0],
        lista: vectorGeneradas
    };
}
